import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  planType: 'monthly' | 'semester' | 'annual'
  paymentMethod: 'CREDIT_CARD' | 'BOLETO'
  userData: {
    name: string
    email: string
    whatsapp: string
    cpf: string
    cep: string
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    estado: string
    cupom?: string | null
  }
  cardData?: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
}

// Plan configuration
const PLAN_CONFIG = {
  monthly: {
    value: 99.90,
    cycle: 'MONTHLY',
    installments: 1,
    description: 'Assinatura Mensal UPZY'
  },
  semester: {
    value: 89.90,
    installments: 6,
    description: 'Plano Semestral UPZY - 6x sem juros'
  },
  annual: {
    value: 84.90,
    installments: 12,
    description: 'Plano Anual UPZY - 12x sem juros'
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting payment processing...')

    // Create Supabase client with service role for testing
    // TODO: Add JWT verification in production
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Generate a temporary user ID for testing
    // TODO: Get real user from JWT in production
    const userId = crypto.randomUUID()

    // Parse request body
    console.log('📥 Parsing request body...')
    const paymentRequest: PaymentRequest = await req.json()

    console.log('📋 Request data:', JSON.stringify({
      planType: paymentRequest.planType,
      paymentMethod: paymentRequest.paymentMethod,
      hasUserData: !!paymentRequest.userData,
      hasCardData: !!paymentRequest.cardData
    }))

    // Validate required fields
    if (!paymentRequest.planType || !paymentRequest.paymentMethod || !paymentRequest.userData) {
      console.error('❌ Missing required fields:', {
        planType: !!paymentRequest.planType,
        paymentMethod: !!paymentRequest.paymentMethod,
        userData: !!paymentRequest.userData
      })
      throw new Error('Missing required fields: planType, paymentMethod, or userData')
    }

    // Sanitize CPF (remove formatting)
    const sanitizedCPF = paymentRequest.userData.cpf.replace(/\D/g, '')
    const sanitizedPhone = paymentRequest.userData.whatsapp.replace(/\D/g, '')

    // Get Asaas configuration
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
    const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL') || 'https://sandbox.asaas.com/api/v3'

    if (!ASAAS_API_KEY) {
      throw new Error('Asaas API key not configured')
    }

    // Step 1: Create or get customer in Asaas
    console.log('Creating/fetching customer in Asaas...')

    const customerPayload = {
      name: paymentRequest.userData.name,
      cpfCnpj: sanitizedCPF,
      email: paymentRequest.userData.email,
      mobilePhone: sanitizedPhone,
      postalCode: paymentRequest.userData.cep.replace(/\D/g, ''),
      address: paymentRequest.userData.logradouro,
      addressNumber: paymentRequest.userData.numero,
      complement: paymentRequest.userData.complemento || '',
      province: paymentRequest.userData.bairro,
      city: paymentRequest.userData.cidade,
      state: paymentRequest.userData.estado,
      externalReference: userId,
      notificationDisabled: true
    }

    const customerResponse = await fetch(`${ASAAS_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify(customerPayload)
    })

    const customerData = await customerResponse.json()

    if (!customerResponse.ok && customerData.errors?.[0]?.code !== 'already_exists') {
      console.error('Asaas customer error:', customerData)
      throw new Error(customerData.errors?.[0]?.description || 'Failed to create customer')
    }

    const customerId = customerData.id || customerData.errors?.[0]?.existingCustomerId

    // Update user with Asaas customer ID
    console.log('💾 Updating user in database with field "name"...')
    const { error: updateError } = await supabaseClient
      .from('users')
      .upsert({
        id: userId,
        email: paymentRequest.userData.email,
        name: paymentRequest.userData.name,
        whatsapp: paymentRequest.userData.whatsapp,
        cpf: sanitizedCPF,
        billing_name: paymentRequest.userData.name,
        cep: paymentRequest.userData.cep,
        logradouro: paymentRequest.userData.logradouro,
        numero: paymentRequest.userData.numero,
        complemento: paymentRequest.userData.complemento,
        bairro: paymentRequest.userData.bairro,
        cidade: paymentRequest.userData.cidade,
        estado: paymentRequest.userData.estado,
        asaas_customer_id: customerId,
        cupom: paymentRequest.userData.cupom || null,
        status: 'pending'
      })

    if (updateError) {
      console.error('Failed to update user:', updateError)
      throw new Error('Failed to save user data')
    }

    // Step 2: Create payment/subscription based on plan type
    const planConfig = PLAN_CONFIG[paymentRequest.planType]
    let asaasPaymentId: string
    let asaasSubscriptionId: string | null = null
    let boletoUrl: string | null = null
    let boletoBarcode: string | null = null

    if (paymentRequest.planType === 'monthly') {
      // Create subscription for monthly plan
      console.log('Creating monthly subscription...')

      const subscriptionPayload: any = {
        customer: customerId,
        billingType: paymentRequest.paymentMethod,
        value: planConfig.value,
        cycle: planConfig.cycle,
        description: planConfig.description,
        externalReference: userId,
      }

      // Add credit card data if payment method is CREDIT_CARD
      if (paymentRequest.paymentMethod === 'CREDIT_CARD' && paymentRequest.cardData) {
        subscriptionPayload.creditCard = {
          holderName: paymentRequest.cardData.holderName,
          number: paymentRequest.cardData.number,
          expiryMonth: paymentRequest.cardData.expiryMonth,
          expiryYear: paymentRequest.cardData.expiryYear,
          ccv: paymentRequest.cardData.ccv
        }

        subscriptionPayload.creditCardHolderInfo = {
          name: paymentRequest.userData.name,
          cpfCnpj: sanitizedCPF,
          postalCode: paymentRequest.userData.cep.replace(/\D/g, ''),
          addressNumber: paymentRequest.userData.numero,
          addressComplement: paymentRequest.userData.complemento,
          mobilePhone: sanitizedPhone
        }
      }

      const subscriptionResponse = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY,
        },
        body: JSON.stringify(subscriptionPayload)
      })

      const subscriptionData = await subscriptionResponse.json()

      if (!subscriptionResponse.ok) {
        console.error('Asaas subscription error:', subscriptionData)
        throw new Error(subscriptionData.errors?.[0]?.description || 'Failed to create subscription')
      }

      asaasSubscriptionId = subscriptionData.id
      asaasPaymentId = subscriptionData.id // For subscriptions, we use subscription ID as payment reference

      if (paymentRequest.paymentMethod === 'BOLETO') {
        boletoUrl = subscriptionData.bankSlipUrl
        boletoBarcode = subscriptionData.identificationField
      }
    } else {
      // Create installment payment for semester/annual plans
      console.log(`Creating ${paymentRequest.planType} installment payment...`)

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 5) // 5 days from now

      const paymentPayload: any = {
        customer: customerId,
        billingType: paymentRequest.paymentMethod,
        installmentCount: planConfig.installments,
        installmentValue: planConfig.value,
        description: planConfig.description,
        dueDate: dueDate.toISOString().split('T')[0],
        externalReference: userId,
      }

      // Add credit card data if payment method is CREDIT_CARD
      if (paymentRequest.paymentMethod === 'CREDIT_CARD' && paymentRequest.cardData) {
        paymentPayload.creditCard = {
          holderName: paymentRequest.cardData.holderName,
          number: paymentRequest.cardData.number,
          expiryMonth: paymentRequest.cardData.expiryMonth,
          expiryYear: paymentRequest.cardData.expiryYear,
          ccv: paymentRequest.cardData.ccv
        }

        paymentPayload.creditCardHolderInfo = {
          name: paymentRequest.userData.name,
          cpfCnpj: sanitizedCPF,
          postalCode: paymentRequest.userData.cep.replace(/\D/g, ''),
          addressNumber: paymentRequest.userData.numero,
          addressComplement: paymentRequest.userData.complemento,
          mobilePhone: sanitizedPhone
        }
      }

      const paymentResponse = await fetch(`${ASAAS_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY,
        },
        body: JSON.stringify(paymentPayload)
      })

      const paymentData = await paymentResponse.json()

      if (!paymentResponse.ok) {
        console.error('Asaas payment error:', paymentData)
        throw new Error(paymentData.errors?.[0]?.description || 'Failed to create payment')
      }

      asaasPaymentId = paymentData.id

      if (paymentRequest.paymentMethod === 'BOLETO') {
        boletoUrl = paymentData.bankSlipUrl
        boletoBarcode = paymentData.identificationField
      }
    }

    // Step 3: Save payment record in database
    const { data: paymentRecord, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: userId,
        plan: paymentRequest.planType,
        amount: planConfig.value * planConfig.installments,
        status: 'pending',
        asaas_payment_id: asaasPaymentId,
        asaas_subscription_id: asaasSubscriptionId,
        billing_type: paymentRequest.paymentMethod,
        installments: planConfig.installments,
        boleto_url: boletoUrl,
        boleto_barcode: boletoBarcode,
        metadata: {
          customer_id: customerId,
          plan_config: planConfig
        }
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Failed to save payment:', paymentError)

      // Attempt rollback: Cancel payment/subscription in Asaas
      try {
        if (asaasSubscriptionId) {
          await fetch(`${ASAAS_BASE_URL}/subscriptions/${asaasSubscriptionId}`, {
            method: 'DELETE',
            headers: {
              'access_token': ASAAS_API_KEY,
            },
          })
        } else if (asaasPaymentId) {
          await fetch(`${ASAAS_BASE_URL}/payments/${asaasPaymentId}`, {
            method: 'DELETE',
            headers: {
              'access_token': ASAAS_API_KEY,
            },
          })
        }
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError)
      }

      throw new Error('Failed to save payment record')
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentRecord.id,
        asaasPaymentId,
        asaasSubscriptionId,
        status: 'pending',
        boletoUrl,
        boletoBarcode,
        message: paymentRequest.paymentMethod === 'BOLETO'
          ? 'Boleto gerado com sucesso! Aguardando pagamento.'
          : 'Pagamento processado! Aguardando confirmação.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Payment processing error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao processar pagamento'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
