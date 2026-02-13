import { useState } from 'react';

export function DecoderTools() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');

    const decodeBase64 = () => {
        try {
            const decoded = atob(input.trim());
            setOutput(decoded);
            setError('');
        } catch (e) {
            setError('Invalid Base64 input');
            setOutput('');
        }
    };

    const decodeHex = () => {
        try {
            const cleaned = input.trim().replace(/\s+/g, '');
            if (!/^[0-9A-Fa-f]+$/.test(cleaned)) {
                throw new Error('Invalid hex');
            }
            const decoded = cleaned.match(/.{1,2}/g)
                ?.map(byte => String.fromCharCode(parseInt(byte, 16)))
                .join('') || '';
            setOutput(decoded);
            setError('');
        } catch (e) {
            setError('Invalid Hex input');
            setOutput('');
        }
    };

    const decodeROT13 = () => {
        try {
            const decoded = input.trim().replace(/[a-zA-Z]/g, (char) => {
                const start = char <= 'Z' ? 65 : 97;
                return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
            });
            setOutput(decoded);
            setError('');
        } catch (e) {
            setError('Invalid ROT13 input');
            setOutput('');
        }
    };

    const decodeBinary = () => {
        try {
            const cleaned = input.trim().replace(/\s+/g, '');
            if (!/^[01]+$/.test(cleaned)) {
                throw new Error('Invalid binary');
            }
            const decoded = cleaned.match(/.{1,8}/g)
                ?.map(byte => String.fromCharCode(parseInt(byte, 2)))
                .join('') || '';
            setOutput(decoded);
            setError('');
        } catch (e) {
            setError('Invalid Binary input (must be 8-bit groups)');
            setOutput('');
        }
    };

    const decodeASCII = () => {
        try {
            const numbers = input.trim().split(/[\s,]+/).filter(n => n);
            const decoded = numbers.map(n => {
                const num = parseInt(n, 10);
                if (isNaN(num) || num < 0 || num > 127) {
                    throw new Error('Invalid ASCII');
                }
                return String.fromCharCode(num);
            }).join('');
            setOutput(decoded);
            setError('');
        } catch (e) {
            setError('Invalid ASCII codes (use numbers 0-127, space/comma separated)');
            setOutput('');
        }
    };

    const clear = () => {
        setInput('');
        setOutput('');
        setError('');
    };

    return (
        <div className="decoder-tools">
            <div className="decoder-header">
                <h3>Decoder Tools</h3>
            </div>
            <div className="decoder-content">
                <div className="decoder-input-section">
                    <label htmlFor="decoder-input">Encoded Input</label>
                    <textarea
                        id="decoder-input"
                        className="decoder-textarea"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste encoded text here..."
                        rows={3}
                    />
                </div>

                <div className="decoder-buttons">
                    <button onClick={decodeBase64} className="decoder-btn decoder-btn-primary">
                        Base64
                    </button>
                    <button onClick={decodeHex} className="decoder-btn decoder-btn-primary">
                        Hex
                    </button>
                    <button onClick={decodeROT13} className="decoder-btn decoder-btn-primary">
                        ROT13
                    </button>
                    <button onClick={decodeBinary} className="decoder-btn decoder-btn-primary">
                        Binary
                    </button>
                    <button onClick={decodeASCII} className="decoder-btn decoder-btn-primary">
                        ASCII
                    </button>
                    <button onClick={clear} className="decoder-btn decoder-btn-secondary">
                        Clear
                    </button>
                </div>

                <div className="decoder-output-section">
                    <label htmlFor="decoder-output">Decoded Output</label>
                    <div className="decoder-output">
                        {error && <div className="decoder-error">{error}</div>}
                        {output && <div className="decoder-success">{output}</div>}
                        {!error && !output && <div className="decoder-placeholder">Output will appear here...</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
