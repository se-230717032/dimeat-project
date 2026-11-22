export type GoalType = "lose" | "maintain" | "gain";

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  birth_date: string | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  goal_type: GoalType | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type OnboardingFields = Pick<
  Profile,
  "birth_date" | "height_cm" | "current_weight_kg" | "target_weight_kg" | "goal_type"
>;
