import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateCoach } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dumbbell, DollarSign, User, MapPin, Upload, X } from "lucide-react";
import { Show } from "@clerk/react";
import { useState, useRef } from "react";

const COUNTRY_CODES = [
  { code: "852", label: "+852 香港" },
  { code: "86",  label: "+86 中國" },
  { code: "886", label: "+886 台灣" },
  { code: "65",  label: "+65 新加坡" },
  { code: "1",   label: "+1 美國/加拿大" },
  { code: "44",  label: "+44 英國" },
  { code: "81",  label: "+81 日本" },
  { code: "82",  label: "+82 韓國" },
  { code: "61",  label: "+61 澳洲" },
  { code: "60",  label: "+60 馬來西亞" },
];

const coachSchema = z.object({
  name: z.string().min(2, "姓名至少需要2個字元"),
  sportsCategory: z.string().min(1, "請選擇運動類別"),
  location: z.string().min(2, "請填寫訓練地點"),
  bio: z.string().min(20, "個人簡介至少需要20個字元以吸引學員"),
  trialPrice: z.coerce.number().min(0, "收費不能為負數"),
  regularPrice: z.coerce.number().min(0, "收費不能為負數"),
  packageDetails: z.string().optional(),
  ageGroups: z.array(z.string()).min(1, "請至少選擇一個年齡組別"),
  profileImageUrl: z.string().optional().or(z.literal('')),
  qualifications: z.string().optional(),
  qualificationProofUrl: z.string().optional().or(z.literal('')),
  whatsappLocalNumber: z.string().regex(/^\d{5,15}$/, "請輸入有效的本地號碼（數字，不含+號或空格）").optional().or(z.literal('')),
});

type CoachFormValues = z.infer<typeof coachSchema>;

const AGE_GROUPS = ["幼童（8歲以下）", "兒童（8至12歲）", "青少年（12-17歲）", "成人（18歲以上）", "長者（60歲以上）"];
const COACH_TYPES = ["專業運動員", "持牌教練"];

export default function CoachRegister() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createCoach = useCreateCoach();

  const [whatsappCC, setWhatsappCC] = useState("852");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CoachFormValues>({
    resolver: zodResolver(coachSchema),
    defaultValues: {
      name: "",
      sportsCategory: "",
      location: "",
      bio: "",
      trialPrice: 0,
      regularPrice: 0,
      packageDetails: "",
      ageGroups: [],
      profileImageUrl: "",
      qualifications: "",
      qualificationProofUrl: "",
      whatsappLocalNumber: "",
    },
  });

  const [coachTypes, setCoachTypes] = useState<string[]>([]);
  const [coachTypeError, setCoachTypeError] = useState("");
  const [qualProofPreview, setQualProofPreview] = useState<string>("");
  const qualProofRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = reject;
      img.src = url;
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "照片太大", description: "請上傳 5MB 以內的照片。", variant: "destructive" });
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      setPhotoPreview(dataUrl);
      form.setValue("profileImageUrl", dataUrl);
    } catch {
      toast({ title: "無法讀取照片", description: "請選擇其他檔案再試。", variant: "destructive" });
    }
  };

  const removePhoto = () => {
    setPhotoPreview("");
    form.setValue("profileImageUrl", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleQualProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "檔案太大", description: "請上傳 5MB 以內的圖片。", variant: "destructive" });
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      setQualProofPreview(dataUrl);
      form.setValue("qualificationProofUrl", dataUrl);
    } catch {
      toast({ title: "無法讀取圖片", description: "請選擇其他檔案再試。", variant: "destructive" });
    }
  };

  const removeQualProof = () => {
    setQualProofPreview("");
    form.setValue("qualificationProofUrl", "");
    if (qualProofRef.current) qualProofRef.current.value = "";
  };

  const onSubmit = (data: CoachFormValues) => {
    if (coachTypes.length === 0) {
      setCoachTypeError("請至少選擇一項身份");
      return;
    }
    setCoachTypeError("");

    const whatsappNumber = data.whatsappLocalNumber
      ? (whatsappCC + data.whatsappLocalNumber).replace(/\D/g, "")
      : undefined;

    createCoach.mutate({
      data: {
        name: data.name,
        sportsCategory: data.sportsCategory,
        location: data.location,
        bio: data.bio,
        trialPrice: data.trialPrice,
        regularPrice: data.regularPrice,
        experienceLevel: coachTypes.join("、"),
        ageGroups: data.ageGroups,
        profileImageUrl: data.profileImageUrl || undefined,
        packageDetails: data.packageDetails || undefined,
        whatsappNumber,
        qualifications: data.qualifications || undefined,
        qualificationProofUrl: data.qualificationProofUrl || undefined,
      } as any
    }, {
      onSuccess: () => {
        toast({
          title: "申請已提交！",
          description: "你的教練資料正等候管理員審核。",
        });
        setLocation("/");
      },
      onError: () => {
        toast({
          title: "提交失敗",
          description: "請檢查輸入內容後再試。",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Layout>
      <div className="bg-slate-50 dark:bg-background py-12 flex-1">
        <div className="container max-w-3xl px-4 md:px-6">
          <Show when="signed-out">
            <div className="text-center py-20 bg-white dark:bg-card rounded-2xl border shadow-sm">
              <h2 className="text-2xl font-bold font-display mb-4">請先登入</h2>
              <p className="text-muted-foreground mb-6">你需要帳戶才能登記成為教練。</p>
              <Button onClick={() => setLocation("/sign-in")}>登入</Button>
            </div>
          </Show>

          <Show when="signed-in">
            <div className="mb-10 text-center">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-4">
                <Dumbbell className="w-8 h-8" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight mb-3">加入運動教練平台</h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                接觸更多學員，管理你的預約，讓你的運動教練事業更上一層樓。
              </p>
            </div>

            <div className="bg-white dark:bg-card rounded-2xl shadow-sm border p-6 md:p-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

                  {/* Basic Info */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <User className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-bold font-display">基本資料</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>全名 / 教練名稱</FormLabel>
                            <FormControl>
                              <Input placeholder="例如：David 教練" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sportsCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>主要運動</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="選擇運動項目" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {["游泳", "瑜伽", "籃球", "網球", "拳擊", "普拉提", "足球", "羽毛球", "跑步", "舞蹈", "高爾夫球", "乒乓球", "體操", "跆拳道", "空手道", "排球", "劍擊", "匹克球", "田徑"].map(sport => (
                                  <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                                ))}
                                <SelectItem value="其他">其他</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>常用訓練地點</FormLabel>
                          <FormControl>
                            <Input placeholder="例如：維多利亞公園，港島東" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Photo upload */}
                    <FormField
                      control={form.control}
                      name="profileImageUrl"
                      render={() => (
                        <FormItem>
                          <FormLabel>個人照片（選填）</FormLabel>
                          <FormDescription>上傳一張清晰的個人照片，最大 5MB。</FormDescription>
                          <FormControl>
                            <div>
                              {photoPreview ? (
                                <div className="relative inline-block">
                                  <img
                                    src={photoPreview}
                                    alt="預覽"
                                    className="w-28 h-28 object-cover rounded-xl border shadow-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={removePhoto}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 hover:bg-muted/50 hover:border-primary/40 transition-colors cursor-pointer gap-2"
                                >
                                  <Upload className="w-7 h-7 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">點擊上傳照片</span>
                                  <span className="text-xs text-muted-foreground/70">JPG、PNG、WEBP，最大 5MB</span>
                                </button>
                              )}
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleFileChange}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* WhatsApp */}
                    <FormField
                      control={form.control}
                      name="whatsappLocalNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp 聯絡號碼（選填）</FormLabel>
                          <FormDescription>學員將透過 WhatsApp 直接聯絡你預約課堂。</FormDescription>
                          <FormControl>
                            <div className="flex gap-2">
                              <Select value={whatsappCC} onValueChange={setWhatsappCC}>
                                <SelectTrigger className="w-44 shrink-0">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {COUNTRY_CODES.map(cc => (
                                    <SelectItem key={cc.code} value={cc.code}>{cc.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="例如：98765432"
                                className="flex-1"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>教練簡介</FormLabel>
                          <FormDescription>向學員介紹你的教練理念和背景。</FormDescription>
                          <FormControl>
                            <Textarea placeholder="我有5年的教練經驗…" className="h-32" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Experience & Targets */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-bold font-display">經驗與目標學員</h2>
                    </div>

                    {/* Coach type checkboxes */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium leading-none mb-1">專業資歷 <span className="text-destructive">*</span></p>
                        <p className="text-xs text-muted-foreground">可同時選擇多項（例如：既是專業運動員，也持有教練牌照）</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {COACH_TYPES.map(type => (
                          <label key={type} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all select-none ${coachTypes.includes(type) ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                            <Checkbox
                              checked={coachTypes.includes(type)}
                              onCheckedChange={(checked) => {
                                setCoachTypeError("");
                                setCoachTypes(prev => checked ? [...prev, type] : prev.filter(t => t !== type));
                              }}
                            />
                            <div>
                              <p className="font-medium text-sm">{type}</p>
                              <p className="text-xs text-muted-foreground">{type === "專業運動員" ? "曾代表隊伍或參加正式賽事" : "持有認可機構頒發的教練牌照"}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      {coachTypeError && <p className="text-sm text-destructive">{coachTypeError}</p>}
                    </div>

                    {/* Qualifications text input */}
                    <FormField
                      control={form.control}
                      name="qualifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>資歷</FormLabel>
                          <FormDescription>列出你的相關認證、資格或學歷 </FormDescription>
                          <FormControl>
                            <Input placeholder="例如：香港田徑經會一級田徑教練，香港亞運游泳代表隊" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Qualification proof upload */}
                    <FormField
                      control={form.control}
                      name="qualificationProofUrl"
                      render={() => (
                        <FormItem>
                          <FormLabel>資歷證明文件</FormLabel>
                          <FormDescription>上傳相關牌照、證書或認證的圖片（選填，PNG / JPG，上限 5MB）。文件僅供管理員審核用途，不會公開展示。</FormDescription>
                          <FormControl>
                            <div>
                              {qualProofPreview ? (
                                <div className="relative w-full max-w-sm">
                                  <img src={qualProofPreview} alt="資歷證明" className="w-full rounded-xl border object-cover max-h-48" />
                                  <button type="button" onClick={removeQualProof} className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1 shadow border">
                                    <X className="w-4 h-4 text-destructive" />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-all"
                                  onClick={() => qualProofRef.current?.click()}
                                >
                                  <Upload className="w-6 h-6 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground text-center">點擊上傳資歷證明圖片</p>
                                  <p className="text-xs text-muted-foreground">PNG / JPG，上限 5MB</p>
                                </div>
                              )}
                              <input ref={qualProofRef} type="file" accept="image/*" className="hidden" onChange={handleQualProofChange} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ageGroups"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base">目標年齡組別</FormLabel>
                            <FormDescription>請選擇所有適用的選項</FormDescription>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {AGE_GROUPS.map((item) => (
                              <FormField
                                key={item}
                                control={form.control}
                                name="ageGroups"
                                render={({ field }) => (
                                  <FormItem
                                    key={item}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-slate-50 transition-colors"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, item])
                                            : field.onChange(field.value?.filter((v) => v !== item));
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer w-full">
                                      {item}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Pricing */}
                  <div className="space-y-6 bg-primary/5 -mx-6 md:-mx-10 px-6 md:px-10 py-8 border-y">
                    <div className="flex flex-col mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold font-display text-primary">明碼實價</h2>
                      </div>
                      <p className="text-sm text-muted-foreground">清晰的收費標準建立信任。我們要求所有教練公開標準收費。</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="trialPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>體驗堂收費（港幣）</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input type="number" className="pl-7 bg-white" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="regularPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>正課每小時收費（港幣）</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input type="number" className="pl-7 bg-white" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="packageDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>套餐優惠（選填）</FormLabel>
                          <FormControl>
                            <Input placeholder="例如：$4000 / 10堂" className="bg-white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" className="w-full md:w-auto px-10 h-12 text-base" disabled={createCoach.isPending}>
                      {createCoach.isPending ? "提交中…" : "提交申請"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </Show>
        </div>
      </div>
    </Layout>
  );
}
