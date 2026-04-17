import { Layout } from "@/components/layout";
import { ShieldCheck, Heart, Users, Target, Sparkles, MapPin, Mail, Phone } from "lucide-react";

export default function About() {
  return (
    <Layout>
      <div className="container max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 font-display">關於我們</h1>
          <p className="text-lg text-muted-foreground">香港最透明、最值得信賴的運動教練審核與搜尋平台</p>
        </div>

        <section className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 md:p-10 mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Sparkles className="w-6 h-6 text-primary" /> 我們的故事</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            運對 SportsMatch HK 創立於 2026 年，源自一個簡單的觀察：在香港尋找一位合適、值得信賴的運動教練，往往比想像中困難。價格不透明、資歷難以核實、評價真假難辨——這些都是學員與家長日常面對的痛點。
          </p>
          <p className="text-muted-foreground leading-relaxed">
            我們相信，每一位想學習運動的香港人，都應該能輕易找到適合自己的教練；而每一位用心經營的教練，也應該獲得公平的曝光機會。這就是運對誕生的原因。
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">嚴格審核</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">所有教練資歷由平台人手核實，包括證書、教學經驗及背景查核，杜絕虛假資訊。</p>
          </div>
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">真實評價</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">每則評價均經審核，確保來自真實學員，杜絕刷評。讓口碑成為最有力的選擇依據。</p>
          </div>
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">透明定價</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">教練清楚列出單對單、小組及套餐價格，無隱藏收費，學員可放心比較選擇。</p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> 我們的使命</h2>
          <div className="bg-white border rounded-2xl p-8">
            <p className="text-muted-foreground leading-relaxed mb-4">
              我們致力於建立一個 <span className="font-semibold text-foreground">透明、安全、互信</span> 的香港運動教練生態圈，讓：
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3"><span className="text-primary font-bold">·</span> 學員能根據真實資訊作出明智選擇</li>
              <li className="flex gap-3"><span className="text-primary font-bold">·</span> 家長能放心為子女挑選優質教練</li>
              <li className="flex gap-3"><span className="text-primary font-bold">·</span> 教練能憑實力與口碑獲得學員信任</li>
              <li className="flex gap-3"><span className="text-primary font-bold">·</span> 香港的運動文化在每一次配對中蓬勃發展</li>
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">數字一覽</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-xl p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">50+</div>
              <div className="text-sm text-muted-foreground">已認證教練</div>
            </div>
            <div className="bg-white border rounded-xl p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">20+</div>
              <div className="text-sm text-muted-foreground">運動類別</div>
            </div>
            <div className="bg-white border rounded-xl p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">18</div>
              <div className="text-sm text-muted-foreground">覆蓋香港地區</div>
            </div>
            <div className="bg-white border rounded-xl p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">100%</div>
              <div className="text-sm text-muted-foreground">人手審核</div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">團隊核心成員</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "陳大文", role: "創辦人 & CEO", desc: "前香港運動代表隊成員，致力推動本地運動產業數碼化。" },
              { name: "李小芬", role: "營運總監", desc: "10 年體育產業經驗，專注教練生態及社群建設。" },
              { name: "黃志強", role: "技術總監", desc: "資深軟件工程師，負責平台技術架構與資訊安全。" },
            ].map(m => (
              <div key={m.name} className="bg-white border rounded-xl p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 mx-auto mb-3 flex items-center justify-center text-white font-bold text-2xl">
                  {m.name.charAt(0)}
                </div>
                <h3 className="font-bold">{m.name}</h3>
                <p className="text-xs text-primary font-medium mb-2">{m.role}</p>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-foreground text-white rounded-2xl p-8 md:p-10">
          <h2 className="text-2xl font-bold mb-6">聯絡我們</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-white/60 mb-0.5">電郵</div>
                <div className="text-sm">hello@sportsmatch.hk</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-white/60 mb-0.5">電話 / WhatsApp</div>
                <div className="text-sm">+852 9000 0000</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-white/60 mb-0.5">辦公室</div>
                <div className="text-sm">香港九龍觀塘區<br />（暫定地址，敬請期待）</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
