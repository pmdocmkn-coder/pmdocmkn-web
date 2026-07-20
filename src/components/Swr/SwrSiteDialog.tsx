import React, { useState, useEffect } from "react";
import { ResponsiveModal } from "../common/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { swrSignalApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { SwrSiteListDto } from "@/types/swr";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: SwrSiteListDto | null;
  onSaved: () => void;
}

export default function SwrSiteDialog({
  open,
  onOpenChange,
  site,
  onSaved,
}: Props) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("Trunking");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (site) {
      setName(site.name);
      setLocation(site.location || "");
      setType(site.type);
    } else {
      setName("");
      setLocation("");
      setType("Trunking");
    }
  }, [site, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Site name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      if (site) {
        await swrSignalApi.updateSite({
          id: site.id,
          name,
          location,
          type,
        });
        toast({ description: "Site updated successfully" });
      } else {
        await swrSignalApi.createSite({
          name,
          location,
          type,
        });
        toast({ description: "Site created successfully" });
      }
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save site",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal 
      open={open} 
      onOpenChange={onOpenChange}
      title={site ? "Edit Site" : "Create New Site"}
      desktopClassName="max-w-md"
    >
        <div className="space-y-4 p-4 pb-0">
          <div className="space-y-2">
            <Label htmlFor="name">
              Site Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter site name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">
              Site Type *
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Trunking">
                  Trunking
                </SelectItem>
                <SelectItem value="Conventional">
                  Conventional
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Saving..." : site ? "Update Site" : "Create Site"}
          </Button>
        </div>
    </ResponsiveModal>
  );
}
