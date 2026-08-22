export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fields?: Record<string, string>;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialProfileActionState: ProfileActionState = {
  status: "idle",
  message: ""
};
