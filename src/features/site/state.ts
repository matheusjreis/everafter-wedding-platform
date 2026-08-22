export type SiteEditorActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fields?: Record<string, string>;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialSiteEditorActionState: SiteEditorActionState = {
  status: "idle",
  message: ""
};
