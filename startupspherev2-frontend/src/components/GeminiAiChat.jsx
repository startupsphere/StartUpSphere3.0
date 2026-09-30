import GrokAiChat from "./GrokAiChat";

/**
 * Re-export GrokAiChat as GeminiAiChat for backwards compatibility.
 */
export default function GeminiAiChat(props) {
  return <GrokAiChat {...props} />;
}
