import React, { useState, useEffect } from "react";
import { swrSignalApi } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-b from-purple-900/90 to-slate-900/90 border border-purple-500/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            {channel ? "Edit Channel" : "Create New Channel"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="channelName" className="text-purple-200">
              Channel Name *
            </Label>
            <Input
              id="channelName"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g., Channel 001, C01 (FN)"
              className="bg-purple-900/30 border-purple-500/30 text-white placeholder:text-purple-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="site" className="text-purple-200">
              Site *
            </Label>
            <Select value={swrSiteId} onValueChange={setSwrSiteId}>
              <SelectTrigger className="bg-purple-900/30 border-purple-500/30 text-white">
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent className="bg-purple-900/90 border-purple-500/30">
                {sites.map((site) => (
                  <SelectItem
                    key={site.id}
                    value={site.id.toString()}
                    className="text-white hover:bg-purple-700"
                  >
                    {site.name} ({site.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedSwrMax" className="text-purple-200">
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
              className="bg-purple-900/30 border-purple-500/30 text-white placeholder:text-purple-400"
            />
            <p className="text-xs text-purple-300">
              Threshold: VSWR below this = Good, above = Bad
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedPwrMax" className="text-purple-200">
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
              className="bg-purple-900/30 border-purple-500/30 text-white placeholder:text-purple-400"
            />
            <p className="text-xs text-purple-300">
              Threshold: FPWR below this = Good, above = Bad
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading
              ? "Saving..."
              : channel
              ? "Update Channel"
              : "Create Channel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
