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
import { Dumbbell, DollarSign, User, MapPin } from "lucide-react";
import { Show } from "@clerk/react";

const coachSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sportsCategory: z.string().min(1, "Please select a category"),
  location: z.string().min(2, "Location is required"),
  bio: z.string().min(20, "Bio should be at least 20 characters to attract students"),
  trialPrice: z.coerce.number().min(0, "Price cannot be negative"),
  regularPrice: z.coerce.number().min(0, "Price cannot be negative"),
  packageDetails: z.string().optional(),
  experienceLevel: z.string().min(1, "Please select experience level"),
  ageGroups: z.array(z.string()).min(1, "Select at least one age group"),
  profileImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});

type CoachFormValues = z.infer<typeof coachSchema>;

const AGE_GROUPS = ["Kids (Under 12)", "Teens (12-17)", "Adults (18+)", "Seniors (60+)"];
const EXPERIENCE_LEVELS = ["Professional Athlete", "Certified Instructor", "Club Level", "Enthusiast"];

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
    },
  });

  const onSubmit = (data: CoachFormValues) => {
    createCoach.mutate({
      data: {
        ...data,
        profileImageUrl: data.profileImageUrl || undefined,
        packageDetails: data.packageDetails || undefined,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Application Submitted!",
          description: "Your coach profile is pending admin approval.",
        });
        setLocation("/");
      },
      onError: (err) => {
        toast({
          title: "Error submitting application",
          description: "Please check your inputs and try again.",
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
              <h2 className="text-2xl font-bold font-display mb-4">Please sign in first</h2>
              <p className="text-muted-foreground mb-6">You need an account to register as a coach.</p>
              <Button onClick={() => setLocation("/sign-in")}>Sign In</Button>
            </div>
          </Show>

          <Show when="signed-in">
            <div className="mb-10 text-center">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-4">
                <Dumbbell className="w-8 h-8" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight mb-3">Join CoachMatch HK</h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Reach more students, manage your bookings, and grow your sports coaching business.
              </p>
            </div>

            <div className="bg-white dark:bg-card rounded-2xl shadow-sm border p-6 md:p-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                  
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <User className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-bold font-display">Basic Profile</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name / Coach Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Coach David" {...field} />
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
                            <FormLabel>Primary Sport</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a sport" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories?.map(cat => (
                                  <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                                <SelectItem value="Other">Other</SelectItem>
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
                          <FormLabel>Usual Training Locations</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Victoria Park, HK Island East" {...field} />
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
                          <FormLabel>Profile Image URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/photo.jpg" {...field} />
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
                          <FormLabel>Coach Bio</FormLabel>
                          <FormDescription>Tell students about your coaching philosophy and background.</FormDescription>
                          <FormControl>
                            <Textarea placeholder="I have been coaching for 5 years..." className="h-32" {...field} />
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
                      <h2 className="text-xl font-bold font-display">Experience & Targets</h2>
                    </div>

                    <FormField
                      control={form.control}
                      name="experienceLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Experience Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your qualification level" />
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
                            <FormLabel className="text-base">Target Age Groups</FormLabel>
                            <FormDescription>Select all that apply</FormDescription>
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
                        <h2 className="text-xl font-bold font-display text-primary">明碼實價 (Transparent Pricing)</h2>
                      </div>
                      <p className="text-sm text-muted-foreground">Clear pricing builds trust. We require all coaches to display standard rates.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="trialPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trial Session Price (HKD)</FormLabel>
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
                            <FormLabel>Regular Hourly Rate (HKD)</FormLabel>
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
                          <FormLabel>Package Deals / Discounts (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. $4000 for 10 sessions" className="bg-white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" className="w-full md:w-auto px-10 h-12 text-base" disabled={createCoach.isPending}>
                      {createCoach.isPending ? "Submitting..." : "Submit Application"}
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
