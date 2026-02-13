import { Link } from 'react-router-dom';
import { DecoderTools } from '../components/DecoderTools';

export function Tools() {
    return (
        <div className="tools-page">
            <div className="tools-header">
                <div>
                    <h1>🔧 Decoder Tools</h1>
                    <p className="tools-subtitle">Decode Base64 and Hex encoded messages</p>
                </div>
                <Link to="/" className="back-button">
                    ← Back to Game
                </Link>
            </div>

            <div className="tools-content">
                <DecoderTools />
            </div>

            <div className="tools-guide">
                <h3>How to Use</h3>
                <div className="guide-grid">
                    <div className="guide-card">
                        <h4>📋 Step 1: Copy Encoded Text</h4>
                        <p>Watch the Traffic Observer and copy suspicious encoded strings like <code>RDQ=</code> or <code>4536</code></p>
                    </div>
                    <div className="guide-card">
                        <h4>🔓 Step 2: Decode</h4>
                        <p>Paste into the input field and click <strong>Decode Base64</strong> or <strong>Decode Hex</strong></p>
                    </div>
                    <div className="guide-card">
                        <h4>🎯 Step 3: Submit</h4>
                        <p>If you get coordinates like "D4" or "J", go back and submit them on the main page</p>
                    </div>
                    <div className="guide-card">
                        <h4>🔁 Layered Encoding</h4>
                        <p>Some clues are double-encoded: Decode Base64 first, then decode the result with Hex</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
