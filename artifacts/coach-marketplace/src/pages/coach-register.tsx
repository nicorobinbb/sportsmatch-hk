import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateCoach, useListCategories } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dumbbell, DollarSign, User, MapPin, Phone } from "lucide-react";
import { Show } from "@clerk/react";

const coachSchema = z.object({
  name: z.string().min(2, "姓名至少需要2個字元"),
  sportsCategory: z.string().min(1, "請選擇運動類別"),
  location: z.string().min(2, "請填寫訓練地點"),
  bio: z.string().min(20, "個人簡介至少需要20個字元以吸引學員"),
  trialPrice: z.coerce.number().min(0, "收費不能為負數"),
  regularPrice: z.coerce.number().min(0, "收費不能為負數"),
  packageDetails: z.string().optional(),
  experienceLevel: z.string().min(1, "請選擇經驗等級"),
  ageGroups: z.array(z.string()).min(1, "請至少選擇一個年齡組別"),
  profileImageUrl: z.string().url("必須是有效的網址").optional().or(z.literal('')),
  whatsappNumber: z.string().regex(/^\d{8,15}$/, "請輸入有效的 WhatsApp 號碼（8至15位數字，不含+號或空格）").optional().or(z.literal('')),
});

type CoachFormValues = z.infer<typeof coachSchema>;

const AGE_GROUPS = ["兒童（12歲以下）", "青少年（12-17歲）", "成人（18歲以上）", "長者（60歲以上）"];
const EXPERIENCE_LEVELS = ["職業運動員", "持牌教練", "俱樂部水平", "運動愛好者"];

export default function CoachRegister() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createCoach = useCreateCoach();
  const { data: categories } = useListCategories();

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
      experienceLevel: "",
      ageGroups: [],
      profileImageUrl: "",
      whatsappNumber: "",
    },
  });

  const onSubmit = (data: CoachFormValues) => {
    createCoach.mutate({
      data: {
        ...data,
        profileImageUrl: data.profileImageUrl || undefined,
        packageDetails: data.packageDetails || undefined,
        whatsappNumber: data.whatsappNumber || undefined,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "申請已提交！",
          description: "你的教練資料正等候管理員審核。",
        });
        setLocation("/");
      },
      onError: (err) => {
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
                                {categories?.map(cat => (
                                  <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                                <SelectItem value="Other">其他</SelectItem>
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

                    <FormField
                      control={form.control}
                      name="profileImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>個人照片網址（選填）</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/photo.jpg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="whatsappNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp 聯絡號碼</FormLabel>
                          <FormDescription>學員將透過 WhatsApp 直接聯絡你預約課堂。</FormDescription>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">+</span>
                              <Input placeholder="85298765432（含國家碼，不含+號）" className="pl-7" {...field} />
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

                    <FormField
                      control={form.control}
                      name="experienceLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>經驗等級</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="選擇你的資歷等級" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {EXPERIENCE_LEVELS.map(level => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                                render={({ field }) => {
                                  return (
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
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== item
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer w-full">
                                        {item}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Pricing (明碼實價) */}
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
