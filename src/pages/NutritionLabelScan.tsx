import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { initDatabase } from '../lib/database/indexeddb';
import type { FoodLogEntry } from '../types/health';
import { applyCrop, applyDownscale, applyPreprocessing, type PreprocessMode } from '../lib/ocr/imagePipeline';
import { parseNutritionLabel, isParseSuccessful, type ParsedData } from '../lib/ocr/nutritionParser';
import { runOcrWithFallbacks } from '../lib/ocr/tesseractRunner';

const Page = styled.div`
  min-block-size: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 16px;
  display: flex;
  justify-content: center;
`;

const Card = styled.div`
  inline-size: min(920px, 100%);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  box-shadow: 0 14px 48px rgba(0, 0, 0, 0.18);
  padding: 18px;
  direction: rtl;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
  flex-wrap: wrap;

  h1 {
    margin: 0;
    font-size: 20px;
    color: #111827;
  }
  p {
    margin: 6px 0 0;
    color: #6b7280;
    font-size: 13px;
    line-height: 1.55;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: 'primary' | 'ghost' | 'danger' }>`
  border: none;
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 800;
  cursor: pointer;
  font-size: 14px;

  ${({ $variant }) =>
    $variant === 'primary'
      ? `background:#27ae60;color:#fff;`
      : $variant === 'danger'
      ? `background:#e74c3c;color:#fff;`
      : `background:transparent;border:1px solid rgba(0,0,0,.12);color:#111827;`}
  &:disabled {
    opacity: .55;
    cursor: not-allowed;
  }
`;

const CameraWrap = styled.div`
  margin-top: 14px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,.10);
  background: #111;
  position: relative;
`;

const Video = styled.video`
  inline-size: 100%;
  block-size: auto;
  display: block;
`;

const Canvas = styled.canvas`
  display: none;
`;

const PreviewCanvas = styled.canvas`
  inline-size: 100%;
  block-size: auto;
  display: block;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,.10);
`;

const Message = styled.div<{ $kind?: 'error' | 'info' }>`
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.55;
  ${({ $kind }) =>
    $kind === 'error'
      ? `background: rgba(231, 76, 60, 0.10); border: 1px solid rgba(231, 76, 60, 0.22); color: #b42318;`
      : `background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.10); color: #374151;`}
`;

const Box = styled.div`
  margin-top: 14px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 14px;
  padding: 14px;

  h2 {
    margin: 0 0 8px;
    font-size: 16px;
    color: #111827;
  }
  .muted {
    color: #6b7280;
    font-size: 13px;
    margin: 0;
  }
`;

const TwoCol = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.div`
  font-weight: 900;
  margin-bottom: 6px;
  color: #111827;
  font-size: 13px;
`;

const Input = styled.input`
  padding: 12px;
  border: 2px solid rgba(0,0,0,.12);
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  &:focus { border-color: rgba(39,174,96,.6); }
`;

const Select = styled.select`
  padding: 12px;
  border: 2px solid rgba(0,0,0,.12);
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  &:focus { border-color: rgba(39,174,96,.6); }
`;

const RawText = styled.details`
  margin-top: 12px;
  padding: 10px;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 12px;
  background: rgba(0,0,0,.02);

  summary {
    cursor: pointer;
    font-weight: 800;
    color: #111827;
    font-size: 13px;
  }

  pre {
    margin-top: 8px;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 12px;
    color: #374151;
    direction: ltr;
    text-align: left;
  }
`;

const Badge = styled.span<{ $color?: 'green' | 'orange' }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 900;
  margin-inline-start: 8px;
  ${({ $color }) =>
    $color === 'green'
      ? `background: rgba(39, 174, 96, 0.12); color: #27ae60;`
      : `background: rgba(230, 126, 34, 0.12); color: #e67e22;`}
`;

const Slider = styled.input`
  width: 100%;
  margin-top: 8px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #111827;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

export const NutritionLabelScanPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  // Crop settings
  const [cropPercent, setCropPercent] = useState<number>(70);
  const [showPreview, setShowPreview] = useState(false);

  // Preprocess settings
  const [preprocessMode, setPreprocessMode] = useState<PreprocessMode>('grayscale-threshold');

  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrMode, setOcrMode] = useState<'eng' | 'eng+ara' | null>(null);
  const [rawText, setRawText] = useState<string>('');

  // Editable fields
  const [caloriesPerServing, setCaloriesPerServing] = useState<number | ''>('');
  const [servingsPerContainer, setServingsPerContainer] = useState<number | ''>('');
  const [servingSizeValue, setServingSizeValue] = useState<number | ''>('');
  const [servingSizeUnit, setServingSizeUnit] = useState<'ml' | 'g'>('g');
  const [protein, setProtein] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fats, setFats] = useState<number | ''>('');

  const [consumedServings, setConsumedServings] = useState<number>(1);
  const [consumedQuantity, setConsumedQuantity] = useState<number | ''>('');

  const [adding, setAdding] = useState(false);

  const startCamera = async () => {
    setMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setMessage({ kind: 'info', text: 'Camera active. Position phone over nutrition label and tap "Capture & Analyze".' });
      }
    } catch {
      setMessage({
        kind: 'error',
        text: 'Failed to start camera. Ensure camera permission is granted and you are on HTTPS.'
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setShowPreview(false);
  };

  useEffect(() => {
    return () => { stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatePreview = () => {
    const video = videoRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!video || !previewCanvas) return;

    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    // Capture current frame at full resolution
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    const captureCtx = captureCanvas.getContext('2d');
    if (!captureCtx) return;
    captureCtx.drawImage(video, 0, 0);

    // Apply crop
    const croppedCanvas = applyCrop(captureCanvas, cropPercent);

    // Apply downscale
    const downscaledCanvas = applyDownscale(croppedCanvas, 1200);

    // Apply preprocessing
    const processedCanvas = applyPreprocessing(downscaledCanvas, preprocessMode);

    // Draw to preview
    previewCanvas.width = processedCanvas.width;
    previewCanvas.height = processedCanvas.height;
    ctx.drawImage(processedCanvas, 0, 0);
  };

  const captureAndOCR = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setMessage({ kind: 'info', text: 'Capturing frame and processing...' });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Apply crop-first pipeline
    const croppedCanvas = applyCrop(canvas, cropPercent);

    // Downscale after crop to max 1200px
    const downscaledCanvas = applyDownscale(croppedCanvas, 1200);

    // Apply preprocessing
    const processedCanvas = applyPreprocessing(downscaledCanvas, preprocessMode);

    // Copy processed result back to main canvas for OCR
    canvas.width = processedCanvas.width;
    canvas.height = processedCanvas.height;
    ctx.drawImage(processedCanvas, 0, 0);

    // Run OCR
    await runOCR(canvas);
  };

  const runOCR = async (canvas: HTMLCanvasElement) => {
    setOcrRunning(true);
    setOcrProgress(0);
    setRawText('');
    setOcrMode(null);

    try {
      const result = await runOcrWithFallbacks(canvas, {
        onProgress: (progress) => setOcrProgress(progress),
        onMessage: (msg) => setMessage({ kind: 'info', text: msg }),
      });

      // Set raw text and OCR mode
      setRawText(result.text);
      setOcrMode(result.usedLang);

      // Parse and fill fields
      const parsed = parseNutritionLabel(result.text);
      fillFields(parsed);

      // Set success message based on result
      if (isParseSuccessful(parsed)) {
        const langStr = result.usedLang === 'eng' ? 'English only' : 'English + Arabic';
        const psmStr = result.usedPsm === 11 ? ' (PSM 11)' : '';
        setMessage({ kind: 'info', text: `Analysis successful using ${langStr}${psmStr}. Review data below.` });
      } else {
        setMessage({
          kind: 'error',
          text: 'Could not extract complete data. Please review raw text and manually input missing fields.'
        });
      }
    } catch (err: any) {
      setMessage({ kind: 'error', text: `OCR Error: ${err?.message || 'Unknown'}` });
    } finally {
      setOcrRunning(false);
    }
  };

  const fillFields = (data: ParsedData) => {
    setCaloriesPerServing(data.caloriesPerServing ?? '');
    setServingsPerContainer(data.servingsPerContainer ?? '');
    setServingSizeValue(data.servingSizeValue ?? '');
    if (data.servingSizeUnit) setServingSizeUnit(data.servingSizeUnit);
    setProtein(data.protein ?? '');
    setCarbs(data.carbs ?? '');
    setFats(data.fats ?? '');
  };

  const computeTotalCalories = (): number | null => {
    const calsPerServ = Number(caloriesPerServing);
    const servSize = Number(servingSizeValue);

    if (!Number.isFinite(calsPerServ) || calsPerServ <= 0) return null;

    // Option 1: consumed servings
    if (Number.isFinite(consumedServings) && consumedServings > 0) {
      return Math.round(calsPerServ * consumedServings);
    }

    // Option 2: consumed quantity (ml/g)
    const qty = Number(consumedQuantity);
    if (Number.isFinite(qty) && qty > 0 && Number.isFinite(servSize) && servSize > 0) {
      return Math.round((qty / servSize) * calsPerServ);
    }

    return null;
  };

  const addToToday = async () => {
    const totalCals = computeTotalCalories();
    if (!totalCals) {
      setMessage({ kind: 'error', text: 'Please fill in calories per serving, serving size, and consumed quantity.' });
      return;
    }

    setAdding(true);
    try {
      const { foodLog } = await initDatabase();

      const p = Number(protein);
      const c = Number(carbs);
      const f = Number(fats);

      const entry: FoodLogEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        mealType: 'snack',
        detectedCalories: totalCals,
        protein: Number.isFinite(p) ? p : undefined,
        carbs: Number.isFinite(c) ? c : undefined,
        fats: Number.isFinite(f) ? f : undefined,
        servingSize: Number.isFinite(consumedServings) ? consumedServings : undefined,
        productName: 'Nutrition Label (OCR)',
        confidence: 0.7
      };

      await foodLog.setItem(entry.id, entry);

      setMessage({ kind: 'info', text: 'Added successfully. Redirecting to dashboard.' });
      setTimeout(() => navigate('/dashboard', { replace: true }), 500);
    } catch {
      setMessage({ kind: 'error', text: 'Error occurred while saving food log entry.' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Page>
      <Card>
        <Header>
          <div>
            <h1>Nutrition Label Scan</h1>
            <p>
              Capture a nutrition label photo, and the app will analyze the text automatically.
              First attempt: English only. If extraction fails, it will retry with English + Arabic.
            </p>
          </div>
          <Actions>
            <Button $variant="ghost" onClick={() => navigate('/dashboard', { replace: true })}>
              Back to Dashboard
            </Button>
            {!cameraActive ? (
              <Button $variant="primary" onClick={startCamera}>Start Camera</Button>
            ) : (
              <Button $variant="danger" onClick={stopCamera}>Stop Camera</Button>
            )}
          </Actions>
        </Header>

        <CameraWrap>
          <Video ref={videoRef} autoPlay playsInline muted />
          <Canvas ref={canvasRef} />
        </CameraWrap>

        {cameraActive && (
          <Box style={{ marginTop: 12 }}>
            <h2>Crop & Preprocess Settings</h2>
            <p className="muted">Adjust crop area and preprocessing mode for better OCR accuracy.</p>

            <Label>Crop Percentage: {cropPercent}%</Label>
            <Slider
              type="range"
              min="50"
              max="100"
              step="5"
              value={cropPercent}
              onChange={(e) => setCropPercent(Number(e.target.value))}
            />

            <div style={{ marginTop: 12 }}>
              <Label>Preprocessing Mode</Label>
              <Select
                value={preprocessMode}
                onChange={(e) => setPreprocessMode(e.target.value as PreprocessMode)}
              >
                <option value="grayscale-threshold">Grayscale + Threshold (Default)</option>
                <option value="adaptive-threshold">Adaptive Threshold</option>
                <option value="none">None (Original)</option>
              </Select>
            </div>

            <div style={{ marginTop: 12 }}>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={showPreview}
                  onChange={(e) => {
                    setShowPreview(e.target.checked);
                    if (e.target.checked) updatePreview();
                  }}
                />
                Show preprocessed preview
              </CheckboxLabel>
            </div>

            {showPreview && (
              <div style={{ marginTop: 12 }}>
                <PreviewCanvas ref={previewCanvasRef} />
                <Button
                  $variant="ghost"
                  onClick={updatePreview}
                  style={{ marginTop: 8, width: '100%' }}
                >
                  Refresh Preview
                </Button>
              </div>
            )}

            <Button
              $variant="primary"
              onClick={captureAndOCR}
              disabled={ocrRunning}
              style={{ width: '100%', marginTop: 12 }}
            >
              {ocrRunning ? `Analyzing... ${ocrProgress}%` : 'Capture & Analyze'}
            </Button>
          </Box>
        )}

        {message && <Message $kind={message.kind}>{message.text}</Message>}

        {ocrMode && (
          <Box>
            <h2>
              OCR Mode Used:
              <Badge $color={ocrMode === 'eng' ? 'green' : 'orange'}>
                {ocrMode === 'eng' ? 'English' : 'English + Arabic'}
              </Badge>
            </h2>

            {rawText && (
              <RawText>
                <summary>View Raw OCR Text</summary>
                <pre>{rawText}</pre>
              </RawText>
            )}
          </Box>
        )}

        {(caloriesPerServing !== '' || rawText) && (
          <Box>
            <h2>Review & Edit Extracted Data</h2>
            <p className="muted">Please verify the following fields and edit if necessary.</p>

            <TwoCol>
              <div>
                <Label>Calories per Serving *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 120"
                  value={caloriesPerServing}
                  onChange={(e) => setCaloriesPerServing(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Servings per Container</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 2"
                  value={servingsPerContainer}
                  onChange={(e) => setServingsPerContainer(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </TwoCol>

            <TwoCol>
              <div>
                <Label>Serving Size - Value *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 250"
                  value={servingSizeValue}
                  onChange={(e) => setServingSizeValue(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Serving Size - Unit *</Label>
                <Select value={servingSizeUnit} onChange={(e) => setServingSizeUnit(e.target.value as 'ml' | 'g')}>
                  <option value="ml">ml</option>
                  <option value="g">g</option>
                </Select>
              </div>
            </TwoCol>

            <TwoCol>
              <div>
                <Label>Protein per Serving (g)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 8"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Carbs per Serving (g)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 25"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </TwoCol>

            <TwoCol>
              <div>
                <Label>Fats per Serving (g)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 3"
                  value={fats}
                  onChange={(e) => setFats(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </TwoCol>
          </Box>
        )}

        {(caloriesPerServing !== '' || rawText) && (
          <Box>
            <h2>Consumption Quantity</h2>
            <p className="muted">Enter servings consumed or quantity in ml/g.</p>

            <TwoCol>
              <div>
                <Label>Servings Consumed</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 1"
                  value={consumedServings}
                  onChange={(e) => setConsumedServings(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Or Quantity in {servingSizeUnit}</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder={`e.g. ${servingSizeValue || 250}`}
                  value={consumedQuantity}
                  onChange={(e) => setConsumedQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </TwoCol>

            <TwoCol>
              <div>
                <Label>Total Calories Computed</Label>
                <Input readOnly value={computeTotalCalories() ?? '—'} />
              </div>
              <div style={{ display: 'flex', alignItems: 'end', gap: 10, flexWrap: 'wrap' }}>
                <Button $variant="primary" onClick={addToToday} disabled={adding || !computeTotalCalories()}>
                  {adding ? 'Adding...' : 'Add to Today'}
                </Button>
                <Button $variant="ghost" onClick={startCamera}>Scan Another</Button>
              </div>
            </TwoCol>

            <Message $kind="info" style={{ marginTop: 12 }}>
              Tip: Hold phone steady and ensure label is clear. If results are inaccurate, manually edit the fields.
            </Message>
          </Box>
        )}
      </Card>
    </Page>
  );
};
