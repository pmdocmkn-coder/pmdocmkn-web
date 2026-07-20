import React, { useState, useEffect } from "react";
import { swrSignalApi } from "@/services/api";
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
import { AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SwrChannelListDto, SwrSiteListDto } from "@/types/swr";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: SwrChannelListDto | null;
  sites: SwrSiteListDto[];
  onSaved: () => void;
}

export default function SwrChannelDialog({
  open,
  onOpenChange,
  channel,
  sites,
  onSaved,
}: Props) {
  const [channelName, setChannelName] = useState("");
  const [swrSiteId, setSwrSiteId] = useState("");
  const [expectedSwrMax, setExpectedSwrMax] = useState("1.5");
  const [expectedPwrMax, setExpectedPwrMax] = useState("100");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("📋 Dialog opened with channel:", channel);

    if (channel) {
      setChannelName(channel.channelName);
      setSwrSiteId(channel.swrSiteId.toString());
      setExpectedSwrMax(channel.expectedSwrMax.toString());
      setExpectedPwrMax((channel.expectedPwrMax ?? 100).toString());

      console.log("📋 Form populated:", {
        channelName: channel.channelName,
        swrSiteId: channel.swrSiteId,
        expectedSwrMax: channel.expectedSwrMax,
        expectedPwrMax: channel.expectedPwrMax,
      });
    } else {
      setChannelName("");
      setSwrSiteId("");
      setExpectedSwrMax("1.5");
      setExpectedPwrMax("100");
    }
    setError("");
  }, [channel, open]);

  const validateForm = (): boolean => {
    if (!channelName.trim()) {
      setError("Channel name is required");
      return false;
    }

    if (!swrSiteId) {
      setError("Site is required");
      return false;
    }

    const swrMax = parseFloat(expectedSwrMax);
    if (isNaN(swrMax) || swrMax < 1.0 || swrMax > 4.0) {
      setError("Expected SWR Max must be between 1.0 and 4.0");
      return false;
    }

    const pwrMax = parseFloat(expectedPwrMax);
    if (isNaN(pwrMax) || pwrMax < 0 || pwrMax > 200) {
      setError("Expected PWR Max must be between 0 and 200");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");

      const siteId = parseInt(swrSiteId);
      const swrMax = parseFloat(expectedSwrMax);
      const pwrMax = parseFloat(expectedPwrMax);

      console.log("💾 Saving channel:", {
        id: channel?.id,
        channelName,
        swrSiteId: siteId,
        expectedSwrMax: swrMax,
        expectedPwrMax: pwrMax,
      });

      if (channel) {
        await swrSignalApi.updateChannel({
          id: channel.id,
          channelName,
          swrSiteId: siteId,
          expectedSwrMax: swrMax,
          expectedPwrMax: pwrMax,
        });

        console.log("✅ Channel updated successfully");

        toast({
          title: "Berhasil",
          description: "Channel berhasil diperbarui.",
        });
      } else {
        await swrSignalApi.createChannel({
          channelName,
          swrSiteId: siteId,
          expectedSwrMax: swrMax,
          expectedPwrMax: pwrMax,
        });

        console.log("✅ Channel created successfully");

        toast({
          title: "Berhasil",
          description: "Channel berhasil ditambahkan.",
        });
      }

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("❌ Save channel error:", error);

      const errorMessage = error.message || "Failed to save channel";
      setError(errorMessage);

      toast({
        title: "Error",
        description: errorMessage,
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
      title={channel ? "Edit Channel" : "Create New Channel"}
      desktopClassName="max-w-md"
    >
        <div className="space-y-4 p-4 pb-0">
          <div className="space-y-2">
            <Label htmlFor="channelName">
              Channel Name *
            </Label>
            <Input
              id="channelName"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g., Channel 001, C01 (FN)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="site">
              Site *
            </Label>
            <Select value={swrSiteId} onValueChange={setSwrSiteId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem
                    key={site.id}
                    value={site.id.toString()}
                  >
                    {site.name} ({site.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedSwrMax">
              Expected SWR Max (1.0 - 4.0) *
            </Label>
            <Input
              id="expectedSwrMax"
              type="number"
              min="1.0"
              max="4.0"
              step="0.1"
              value={expectedSwrMax}
              onChange={(e) => setExpectedSwrMax(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Threshold: VSWR below this = Good, above = Bad
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedPwrMax">
              Expected PWR Max (0 - 200 Watts) *
            </Label>
            <Input
              id="expectedPwrMax"
              type="number"
              min="0"
              max="200"
              step="1"
              value={expectedPwrMax}
              onChange={(e) => setExpectedPwrMax(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Threshold: FPWR below this = Good, above = Bad
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Saving..." : channel ? "Update Channel" : "Create Channel"}
          </Button>
        </div>
    </ResponsiveModal>
  );
}
