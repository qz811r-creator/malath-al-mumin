import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VERSE_CATEGORIES: Record<string, { desc: string; verses: [number, number][] }> = {
  anxiety_fear: {
    desc: "القلق، الخوف من المستقبل، التوتر، الهلع، والرهبة",
    verses: [[13,28],[65,3],[20,46],[9,40],[3,173],[3,175],[2,112],[2,274],[6,48],[7,35],[10,62],[41,30],[46,13],[8,2],[48,4],[48,18],[48,26],[2,248],[9,26],[33,3],[27,62]]
  },
  sadness_grief: {
    desc: "الحزن العميق، الفقد، البكاء، كسرة القلب، والهم",
    verses: [[12,86],[93,3],[93,4],[93,5],[94,5],[94,6],[2,155],[2,156],[2,157],[3,139],[15,97],[15,98],[16,127],[27,70],[36,76],[31,23],[28,7],[28,13],[19,24],[12,84],[12,87]]
  },
  exhaustion_burnout: {
    desc: "الإرهاق، التعب النفسي والجسدي، ثقل المسؤوليات، والضغط فوق الطاقة",
    verses: [[2,286],[2,233],[7,42],[23,62],[65,7],[4,28],[2,185],[22,78],[5,6],[94,1],[94,2],[94,3],[94,7],[94,8],[73,20],[18,46],[29,6],[11,115],[16,96],[39,10],[35,34]]
  },
  loneliness_alienation: {
    desc: "الوحدة، الغربة، الشعور بالتخلي، قلة السند، والانطواء",
    verses: [[2,186],[50,16],[57,4],[58,7],[28,24],[19,4],[19,48],[19,49],[18,16],[21,89],[3,38],[25,74],[11,56],[6,59],[10,61],[34,3],[42,9],[2,257],[7,196],[45,19],[16,128]]
  },
  confusion_lost: {
    desc: "الحيرة، التيه، التشتت، صعوبة اتخاذ القرار، والبحث عن الطريق الصحيح",
    verses: [[29,69],[1,6],[2,2],[6,161],[10,25],[16,9],[18,10],[18,24],[20,25],[20,26],[28,22],[42,52],[48,2],[64,11],[67,22],[93,7],[2,150],[3,101],[4,175],[5,16],[24,35]]
  },
  guilt_repentance: {
    desc: "تأنيب الضمير، الذنب، التقصير، الندم، والعودة إلى الله",
    verses: [[39,53],[39,54],[25,70],[25,71],[4,110],[3,135],[3,136],[11,114],[20,82],[42,25],[66,8],[2,222],[7,153],[16,119],[6,54],[7,23],[21,87],[28,16],[38,24],[38,25],[110,3]]
  },
  sustenance_work: {
    desc: "الرزق، الضيق المادي، الديون، البحث عن عمل، والخوف من الفقر",
    verses: [[65,2],[65,3],[51,22],[51,58],[11,6],[29,60],[34,36],[34,39],[42,12],[42,27],[17,30],[28,82],[30,37],[39,52],[2,261],[2,268],[71,10],[71,11],[71,12],[14,34],[93,8]]
  },
  injustice_betrayal: {
    desc: "الظلم، الخذلان، أذى الناس، القهر، وتكالب الأعداء أو الحاسدين",
    verses: [[8,30],[3,54],[14,42],[22,38],[22,60],[26,227],[40,44],[40,51],[12,18],[12,90],[54,10],[21,83],[21,84],[38,41],[17,80],[17,81],[41,34],[41,35],[25,63],[3,186],[68,48]]
  },
  blocked_paths: {
    desc: "انسداد الطرق، تعسر الأمور، الكرب الشديد، وانتظار المخرج",
    verses: [[26,62],[21,88],[12,110],[2,214],[33,10],[33,11],[65,1],[65,4],[35,2],[10,107],[11,57],[18,39],[27,62],[40,60],[2,153],[7,128],[11,49],[12,21],[42,19],[55,29],[94,4]]
  },
  gratitude_peace: {
    desc: "الامتنان، الشكر، السكينة، الفرح بنعم الله، والرضا",
    verses: [[14,7],[16,18],[16,53],[16,97],[27,19],[27,40],[31,12],[34,13],[39,7],[2,152],[2,172],[3,145],[4,147],[7,144],[10,58],[17,3],[25,62],[36,33],[54,35],[55,13],[93,11]]
  },
  patience_endurance: {
    desc: "الصبر الطويل، التحمل، الثبات على الحق، ومجاهدة النفس",
    verses: [[2,45],[2,153],[2,250],[3,200],[8,46],[11,11],[16,96],[16,126],[18,28],[20,130],[23,111],[25,20],[28,54],[29,59],[31,17],[32,24],[33,35],[42,43],[46,35],[52,48],[70,5]]
  },
  weakness_selfdoubt: {
    desc: "الضعف، قلة الثقة بالنفس، الإحباط، والشعور بالفشل أو العجز",
    verses: [[3,139],[47,35],[17,70],[95,4],[30,54],[8,66],[2,249],[3,146],[18,39],[20,68],[28,5],[28,35],[7,144],[9,14],[3,160],[4,76],[13,11],[17,84],[29,69],[53,39],[53,40]]
  },
  family_relationships: {
    desc: "العلاقات الأسرية، الوالدين، الزوجين، الأبناء، وإصلاح ذات البين",
    verses: [[30,21],[17,23],[17,24],[25,74],[46,15],[31,14],[31,15],[4,1],[4,19],[4,35],[7,189],[14,40],[14,41],[2,187],[49,10],[49,11],[49,12],[64,14],[66,6],[19,14],[19,32]]
  },
  spiritual_dryness: {
    desc: "الفتور الروحي، قسوة القلب، الغفلة، والرغبة في الخشوع والقرب",
    verses: [[57,16],[39,22],[39,23],[29,45],[20,14],[7,205],[13,28],[3,191],[8,2],[22,35],[23,1],[23,2],[32,16],[35,29],[50,37],[51,17],[51,18],[73,6],[73,8],[76,25],[87,14]]
  },
  hope_optimism: {
    desc: "التفاؤل، حسن الظن بالله، انتظار البشائر، وبداية صفحة جديدة",
    verses: [[12,87],[15,55],[15,56],[42,28],[30,50],[7,57],[2,216],[24,11],[65,1],[94,5],[94,6],[93,4],[93,5],[3,174],[10,58],[11,73],[19,4],[21,90],[27,63],[35,34],[48,1]]
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const userFeeling = (body.userFeeling || '').trim()
    if (!userFeeling) {
      return new Response(JSON.stringify({ error: "يرجى كتابة شعورك أولاً" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    if (!groqApiKey) {
      throw new Error("مفتاح GROQ_API_KEY غير موجود في إعدادات السيرفر")
    }

    const categoriesList = Object.entries(VERSE_CATEGORIES)
      .map(([key, val]) => `- ${key}: ${val.desc}`)
      .join('\n')

    const prompt = `أنت مستشار نفسي وروحي حكيم ودافئ في تطبيق "ملاذ المؤمن".
المستخدم كتب شعوره التالي: "${userFeeling}"

اختر أنسب مفتاح فئة (category) من القائمة التالية:
${categoriesList}

واكتب رسالة جبر خاطر ومواساة قصيرة (جملتان إلى ثلاث جمل) باللغة العربية الفصحى الدافئة والهادئة.

أجب بصيغة JSON فقط بهذا الشكل:
{"category": "anxiety_fear", "message": "رسالة المواساة هنا"}`

    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    })

    const aiData = await aiResponse.json()
    if (!aiResponse.ok || !aiData.choices?.[0]?.message?.content) {
      throw new Error("Groq API Error: " + JSON.stringify(aiData))
    }

    const parsed = JSON.parse(aiData.choices[0].message.content)
    const selectedCat = VERSE_CATEGORIES[parsed.category] || VERSE_CATEGORIES.anxiety_fear
    const [surah, ayah] = selectedCat.verses[Math.floor(Math.random() * selectedCat.verses.length)]

    const quranRes = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/quran-uthmani`)
    const quranData = await quranRes.json()

    if (!quranData?.data?.text) {
      throw new Error(`Quran API Error for ${surah}:${ayah}`)
    }

    return new Response(JSON.stringify({
      verse: quranData.data.text,
      reference: `${quranData.data.surah.name} - آية ${quranData.data.numberInSurah}`,
      message: parsed.message || "اطمئن، فإن لطف الله أقرب إليك مما تظن، وما ضاق أمر إلا جعل الله بعده فرجاً ومخرجاً."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Function Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
