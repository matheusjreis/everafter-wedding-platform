"use client";

import { ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { ImagePresetPicker } from "./image-preset-picker";

type ImageUploadFieldProps = {
  label: string;
  name: string;
  initialUrl: string;
  uploadPathPrefix: string;
  helper?: string;
  presets?: Array<{
    label: string;
    value: string;
  }>;
};

function getSafeFilename(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  return `${crypto.randomUUID()}.${extension.replace(/[^a-z0-9]/g, "") || "jpg"}`;
}

export function ImageUploadField({ label, name, initialUrl, uploadPathPrefix, helper, presets = [] }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(file?: File) {
    if (!file) {
      return;
    }

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Escolha uma imagem válida.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Use uma imagem de até 10 MB.");
      return;
    }

    setIsUploading(true);

    const supabase = createSupabaseBrowserClient();
    const path = `${uploadPathPrefix}/${getSafeFilename(file)}`;
    const { error: uploadError } = await supabase.storage.from("wedding-media").upload(path, file, {
      cacheControl: "31536000",
      upsert: false
    });

    if (uploadError) {
      setError("Não foi possível enviar a imagem. Confira o bucket wedding-media no Supabase.");
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from("wedding-media").getPublicUrl(path);
    setUrl(data.publicUrl);
    setIsUploading(false);
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input name={name} type="hidden" value={url} />
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => void handleFileChange(event.target.files?.[0])}
      />

      <div
        className={cn(
          "grid gap-4 rounded-lg border bg-background p-4 transition",
          url ? "sm:grid-cols-[160px_1fr]" : "border-dashed"
        )}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-32 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="size-8" aria-hidden="true" />
          )}
        </button>

        <div className="flex flex-col justify-center gap-3">
          <div>
            <p className="text-sm font-semibold">{url ? "Imagem selecionada" : "Envie uma imagem do computador"}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {helper ?? "PNG, JPG, WebP ou GIF. Tamanho máximo de 10 MB."}
            </p>
          </div>
          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UploadCloud className="mr-2 size-4" />}
              {isUploading ? "Enviando..." : "Escolher foto"}
            </Button>
            {url ? (
              <Button type="button" variant="ghost" onClick={() => setUrl("")} disabled={isUploading}>
                <X className="mr-2 size-4" />
                Remover
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {presets.length ? (
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Ou escolha uma imagem padrão
          </p>
          <ImagePresetPicker
            value={url}
            onChange={setUrl}
            options={presets}
          />
        </div>
      ) : null}
    </div>
  );
}
