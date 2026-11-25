import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userFeeling } = await req.json()
    const groqKey = Deno.env.get('GROQ_API_KEY')

    // 1. جلب الموديلات المتاحة في حسابك تلقائياً
    const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${groqKey}` }
    })
    const modelsData = await modelsRes.json()
    const availableModels = (modelsData.data || [])
      .map((m: any) => m.id)
      .filter((id: string) => !id.includes('whisper') && !id.includes('guard') && !id.includes('tts'))

    const selectedModel = availableModels.find((id: string) => id.includes('llama') || id.includes('qwen') || id.includes('gemma')) || availableModels[0]

    const prompt = `أنت مساعد إيماني هادئ في موقع "ملاذ المؤمن". المستخدم كتب شعوره: "${userFeeling}".
    اختر له آية قرآنية مناسبة جداً ومطمئنة لحالته.
    أعد الإجابة بصيغة JSON فقط بدون أي نص إضافي بهذا الشكل:
    {"surah_ayah": "رقم_السورة:رقم_الآية", "message": "رسالة مواساة دافئة ومختصرة من سطرين تربط الآية بشعوره"}
    مثال للـ surah_ayah: "13:28" أو "94:5".`

    // 2. استنتاج الآية ورسالة المواساة
    const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    })

    const aiData = await aiRes.json()
    
    if (!aiData.choices || !aiData.choices[0]) {
      return new Response(JSON.stringify({ groq_error: aiData, tried_model: selectedModel }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const aiResult = JSON.parse(aiData.choices[0].message.content)

    // 3. جلب النص العثماني المضبوط من API القرآن المجاني
    const quranRes = await fetch(`https://api.alquran.cloud/v1/ayah/${aiResult.surah_ayah}/quran-uthmani`)
    const quranData = await quranRes.json()

    const finalResponse = {
      verse: quranData.data.text,
      reference: `${quranData.data.surah.name} - آية ${quranData.data.numberInSurah}`,
      message: aiResult.message
    }

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
