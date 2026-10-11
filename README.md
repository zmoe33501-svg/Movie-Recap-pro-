# MovieRecap Studio - GitHub & Vercel Deployment Guide

မြန်မာဘာသာနှင့် အင်္ဂလိပ်ဘာသာ ရုပ်ရှင်ဇာတ်လမ်းပြော (Movie Recap)၊ ဗီဒီယို ဘာသာပြန်ခြင်းနှင့် AI အသံထပ်သွင်းခြင်း (Video Dubbing) စတူဒီယိုကို GitHub နှင့် Vercel ပေါ်သို့ တင်သွင်း အသုံးပြုနည်း လမ်းညွှန်ဖြစ်ပါသည်။

---

## ၁။ Vercel ပေါ်တွင် API Key နှင့် ဝန်ဆောင်မှုများ အလုပ်လုပ်ပုံ

* **ဗီဒီယို မူပိုင်ခွင့် ကာကွယ်ခြင်း (Anti-Copyright Mirror & 5s Freeze Frame):**
  * Browser အတွင်း HTML5 Canvas & MediaRecorder ဖြင့် တိုက်ရိုက်လုပ်ဆောင်သဖြင့် **မည်သည့် API Key မှ ထည့်ရန် မလိုပါ (100% Free)**။
* **စာတန်းထိုး (Subtitles)၊ နောက်ခံဝါး (Blur Box) နှင့် Logo:**
  * **မည်သည့် API Key မှ ထည့်ရန် မလိုပါ (100% Free)**။
* **AI အသံသွင်းခြင်း (20 Neural Human Voices in Burmese & English):**
  * Edge Neural Speech Engine ဖြင့် အလုပ်လုပ်သဖြင့် **မည်သည့် API Key မှ မလိုဘဲ အခမဲ့ အသုံးပြုနိုင်ပါသည် (100% Free)**။
* **ဗီဒီယို စကားပြော ထုတ်ယူခြင်း & ဘာသာပြန်ဆိုခြင်း (AI Dialogue Transcription & Translation):**
  * Google Gemini API ကို အသုံးပြုပါသည်။
  * Vercel ပေါ်တွင် **Project Settings > Environment Variables** တွင် `GEMINI_API_KEY` ကို ထည့်သွင်းထားပေးရုံဖြင့် Website သို့ လာရောက်သုံးစွဲသူ အားလုံး အလွယ်တကူ သုံးနိုင်မည် ဖြစ်ပါသည်။

---

## ၂။ GitHub ပေါ်သို့ တင်နည်း (Git Push)

Terminal တွင် အောက်ပါ command များကို အစဉ်လိုက် ရိုက်ထည့်ပါ -

```bash
git add .
git commit -m "Add Vercel deployment configuration and 5-min video support"
git push origin main
```

---

## ၃။ Vercel ပေါ်သို့ တင်နည်း (Deploy to Vercel)

1. [vercel.com](https://vercel.com) သို့ ဝင်ရောက်ပြီး **Add New Project** ကို နှိပ်ပါ။
2. သင်၏ **GitHub Repository** ကို ရွေးချယ်ပြီး **Import** လုပ်ပါ။
3. **Environment Variables** ကဏ္ဍတွင် အောက်ပါ Key ကို ထည့်သွင်းပါ -
   * **Key:** `GEMINI_API_KEY`
   * **Value:** သင်၏ Google AI Studio မှ ရရှိသော Gemini API Key (e.g. `AIzaSy...`)
4. **Deploy** ခလုတ်ကို နှိပ်လိုက်ပါက စက္ကန့်ပိုင်းအတွင်း သင့်ကိုယ်ပိုင် Web URL (e.g. `https://your-project.vercel.app`) ဖြင့် လူအများ စတင် အသုံးပြုနိုင်ပါပြီ!
