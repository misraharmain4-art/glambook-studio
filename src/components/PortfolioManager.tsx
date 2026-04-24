import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Plus, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type PortfolioItem = {
  id: string;
  artist_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

type Props = { artistId: string };

export function PortfolioManager({ artistId }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("artist_portfolio")
      .select("*")
      .eq("artist_id", artistId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setItems((data as PortfolioItem[]) ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max file size 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/portfolio/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("artist-media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("artist-media").getPublicUrl(path);
      const { error: insErr } = await supabase.from("artist_portfolio").insert({
        artist_id: artistId,
        image_url: pub.publicUrl,
        caption: caption || null,
        sort_order: items.length,
      });
      if (insErr) throw insErr;
      toast.success("Photo uploaded ✨");
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (item: PortfolioItem) => {
    if (!confirm("Delete this photo?")) return;
    // Try to extract storage path from public URL to delete file too
    try {
      const url = new URL(item.image_url);
      const marker = "/artist-media/";
      const idx = url.pathname.indexOf(marker);
      if (idx >= 0) {
        const path = url.pathname.slice(idx + marker.length);
        await supabase.storage.from("artist-media").remove([path]);
      }
    } catch {
      // ignore
    }
    await supabase.from("artist_portfolio").delete().eq("id", item.id);
    load();
  };

  return (
    <div className="bg-card rounded-3xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <ImageIcon className="size-5 text-primary" /> Portfolio ({items.length})
        </h3>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-border bg-blush/20 p-4 mb-5">
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Caption (optional)</label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Bridal look · Goa wedding"
              className="mt-1 bg-white/70 border-0"
              maxLength={80}
            />
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onUpload}
              className="hidden"
              id="portfolio-upload"
            />
            <Button
              asChild
              disabled={uploading}
              className="gradient-rose text-white border-0 shadow-glow cursor-pointer"
            >
              <label htmlFor="portfolio-upload">
                <Upload className="size-4" /> {uploading ? "Uploading…" : "Upload photo"}
              </label>
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">JPG/PNG · max 5MB · public</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          <Plus className="size-8 mx-auto text-primary/40 mb-2" />
          Showcase your best work — your first photo will sit at the top of your profile.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((it) => (
            <div key={it.id} className="group relative aspect-square rounded-2xl overflow-hidden shadow-soft">
              <img src={it.image_url} alt={it.caption ?? ""} className="w-full h-full object-cover transition group-hover:scale-105" />
              {it.caption && (
                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-[11px]">
                  {it.caption}
                </div>
              )}
              <button
                onClick={() => remove(it)}
                className="absolute top-2 right-2 size-7 rounded-full bg-white/90 grid place-items-center opacity-0 group-hover:opacity-100 transition hover:bg-destructive hover:text-white"
                aria-label="Delete"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PortfolioGallery({ artistId }: { artistId: string }) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("artist_portfolio")
      .select("*")
      .eq("artist_id", artistId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as PortfolioItem[]) ?? []));
  }, [artistId]);

  if (items.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => setLightbox(it.image_url)}
            className="group relative aspect-square rounded-2xl overflow-hidden shadow-soft hover-lift"
          >
            <img src={it.image_url} alt={it.caption ?? ""} className="w-full h-full object-cover transition group-hover:scale-105" />
            {it.caption && (
              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent text-white text-[11px] text-left">
                {it.caption}
              </div>
            )}
          </button>
        ))}
      </div>
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4 cursor-zoom-out"
        >
          <button className="absolute top-4 right-4 size-10 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20" aria-label="Close">
            <X className="size-5" />
          </button>
          <img src={lightbox} alt="" className="max-h-[90vh] max-w-[95vw] rounded-2xl shadow-lux" />
        </div>
      )}
    </>
  );
}
