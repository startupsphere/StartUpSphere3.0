import GroqAiChat from "./GroqAiChat";

/**
 * Re-export GroqAiChat for backward compatibility
 */
export default function GrokAiChat(props) {
  return <GroqAiChat {...props} />;
}
