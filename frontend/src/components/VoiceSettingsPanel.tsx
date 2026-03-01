/**
 * Voice Settings Panel
 * ====================
 * Dropdown panel for voice settings in navbar.
 * Shows language, speaker selection, and voice toggles.
 */

import React from "react";
import {
  Volume2,
  VolumeX,
  Languages,
  User,
  Bell,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useVoice,
  LANGUAGE_NAMES,
  SPEAKER_INFO,
  type VoiceLanguage,
  type VoiceSpeaker,
} from "@/context/VoiceContext";

export function VoiceSettingsPanel() {
  const {
    settings,
    isPlaying,
    isSpeaking,
    setEnabled,
    setLanguage,
    setSpeaker,
    setAutoPlayNotifications,
    setAutoPlayAIResponses,
    setVolume,
    stop,
  } = useVoice();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            settings.enabled && "text-primary",
            isSpeaking && "animate-pulse"
          )}
        >
          {settings.enabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          )}
          {isPlaying && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 animate-ping" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-4">
        <DropdownMenuLabel className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            <span>Voice Settings</span>
            <Badge variant="secondary" className="text-xs">
              Sarvam AI
            </Badge>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={setEnabled}
          />
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div className="space-y-4 py-2">
          {/* Language Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Languages className="h-4 w-4 text-muted-foreground" />
              Language
            </label>
            <Select
              value={settings.language}
              onValueChange={(v) => setLanguage(v as VoiceLanguage)}
              disabled={!settings.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(LANGUAGE_NAMES) as VoiceLanguage[]).map((code) => (
                  <SelectItem key={code} value={code}>
                    {LANGUAGE_NAMES[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speaker Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              Voice Persona
            </label>
            <Select
              value={settings.speaker}
              onValueChange={(v) => setSpeaker(v as VoiceSpeaker)}
              disabled={!settings.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SPEAKER_INFO) as VoiceSpeaker[]).map((speaker) => (
                  <SelectItem key={speaker} value={speaker}>
                    <div className="flex items-center gap-2">
                      <span>{SPEAKER_INFO[speaker].name}</span>
                      <Badge variant="outline" className="text-xs">
                        {SPEAKER_INFO[speaker].gender}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Volume Slider */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium">
              <span>Volume</span>
              <span className="text-muted-foreground">
                {Math.round(settings.volume * 100)}%
              </span>
            </label>
            <Slider
              value={[settings.volume * 100]}
              onValueChange={([v]) => setVolume(v / 100)}
              max={100}
              step={5}
              disabled={!settings.enabled}
              className="w-full"
            />
          </div>

          <DropdownMenuSeparator />

          {/* Auto-play Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Auto-play Notifications
              </label>
              <Switch
                checked={settings.autoPlayNotifications}
                onCheckedChange={setAutoPlayNotifications}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Read AI Responses
              </label>
              <Switch
                checked={settings.autoPlayAIResponses}
                onCheckedChange={setAutoPlayAIResponses}
                disabled={!settings.enabled}
              />
            </div>
          </div>

          {/* Stop Button */}
          {isPlaying && (
            <>
              <DropdownMenuSeparator />
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={stop}
              >
                <VolumeX className="h-4 w-4 mr-2" />
                Stop Speaking
              </Button>
            </>
          )}
        </div>

        <DropdownMenuSeparator />

        <p className="text-xs text-muted-foreground text-center pt-2">
          GreenGrid AI Voice · 11 Indian Languages
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
