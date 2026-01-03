import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { createWorker } from 'tesseract.js';
import { initDatabase } from '../lib/database/indexeddb';
import type { FoodLogEntry } from '../types/health';

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

type ParsedData = {
  caloriesPerServing: number | null;
  servingsPerContainer: number | null;
  servingSizeValue: number | null;
  servingSizeUnit: 'ml' | 'g' | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
};

function parseNutritionLabel(text: string): ParsedData {
  const result: ParsedData = {
    caloriesPerServing: null,
    servingsPerContainer: null,
    servingSizeValue: null,
    servingSizeUnit: null,
    protein: null,
    carbs: null,
    fats: null,
  };

  // Calories
  let match = text.match(/Calories\s*([0-9]{1,4})/i);
  if (!match) match = text.match(/السعرات(?:\s*الحرارية)?\s*([0-9]{1,4})/i);
  if (match) result.caloriesPerServing = Number(match[1]);

  // Servings per container
  match = text.match(/servings?\s*per\s*container\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match) match = text.match(/عدد\s*الحصص\s*(?:في\s*العبوة)?\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (match) result.servingsPerContainer = Number(match[1]);

  // Serving size
  match = text.match(/Serving\s*Size\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(ml|mL|g|gm|grams)/i);
  if (!match) match = text.match(/حجم\s*الحصة\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(مل|ml|جم|g)/i);
  if (match) {
    result.servingSizeValue = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (unit.includes('ml') || unit.includes('مل')) {
      result.servingSizeUnit = 'ml';
    } else {
      result.servingSizeUnit = 'g';
    }
  }

  // Protein
  match = text.match(/Protein\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match) match = text.match(/بروتين\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (match) result.protein = Number(match[1]);

  // Carbs
  match = text.match(/Carbohydrate[s]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match) match = text.match(/الكربوهيدرات\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (match) result.carbs = Number(match[1]);

  // Fats
  match = text.match(/Total\s*Fat\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match) match = text.match(/الدهون\s*الكلية\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (match) result.fats = Number(match[1]);

  return result;
}

function isParseSuccessful(data: ParsedData): boolean {
  return data.caloriesPerServing !== null && data.servingSizeValue !== null;
}

export const NutritionLabelScanPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

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
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setMessage({ kind: 'info', text: 'الكاميرا نشطة. ثبّت الهاتف فوق ملصق التغذية واضغط "التقاط وتحليل".' });
      }
    } catch {
      setMessage({
        kind: 'error',
        text: 'فشل تشغيل الكاميرا. تأكد من منح إذن الكاميرا وأنك على HTTPS.'
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
  };

  useEffect(() => {
    return () => { stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureAndOCR = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setMessage({ kind: 'info', text: 'جاري التقاط الإطار ومعالجته…' });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Downscale to ~1200px on longest side
    const maxDim = 1200;
    const scale = Math.min(maxDim / canvas.width, maxDim / canvas.height, 1);

    if (scale < 1) {
      const newWidth = Math.floor(canvas.width * scale);
      const newHeight = Math.floor(canvas.height * scale);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = newWidth;
      tempCanvas.height = newHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }

    // Preprocess: grayscale + contrast + threshold
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Grayscale
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

      // Increase contrast
      const contrast = 1.5;
      let adjusted = ((gray - 128) * contrast) + 128;

      // Simple threshold
      adjusted = adjusted > 128 ? 255 : 0;

      data[i] = data[i + 1] = data[i + 2] = adjusted;
    }

    ctx.putImageData(imageData, 0, 0);

    // Run OCR
    await runOCR(canvas);
  };

  const runOCR = async (canvas: HTMLCanvasElement) => {
    setOcrRunning(true);
    setOcrProgress(0);
    setRawText('');
    setOcrMode(null);

    try {
      // Attempt #1: English only
      setMessage({ kind: 'info', text: 'OCR محاولة #1: إنجليزي فقط…' });
      const worker1 = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      const { data: { text: text1 } } = await worker1.recognize(canvas);
      await worker1.terminate();

      const parsed1 = parseNutritionLabel(text1);

      if (isParseSuccessful(parsed1)) {
        // Success with English only
        setRawText(text1);
        setOcrMode('eng');
        fillFields(parsed1);
        setMessage({ kind: 'info', text: 'تم التحليل بنجاح باستخدام الإنجليزية فقط. راجع البيانات أدناه.' });
        setOcrRunning(false);
        return;
      }

      // Attempt #2: English + Arabic
      setMessage({ kind: 'info', text: 'OCR محاولة #2: إنجليزي + عربي…' });
      setOcrProgress(0);

      const worker2 = await createWorker(['eng', 'ara'], 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      const { data: { text: text2 } } = await worker2.recognize(canvas);
      await worker2.terminate();

      const parsed2 = parseNutritionLabel(text2);

      setRawText(text2);
      setOcrMode('eng+ara');
      fillFields(parsed2);

      if (isParseSuccessful(parsed2)) {
        setMessage({ kind: 'info', text: 'تم التحليل باستخدام الإنجليزية + العربية. راجع البيانات أدناه.' });
      } else {
        setMessage({
          kind: 'error',
          text: 'تعذر استخراج البيانات الكاملة. يرجى مراجعة النص الخام والإدخال اليدوي للحقول المفقودة.'
        });
      }
    } catch (err: any) {
      setMessage({ kind: 'error', text: `خطأ OCR: ${err?.message || 'غير معروف'}` });
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
      setMessage({ kind: 'error', text: 'يرجى ملء السعرات لكل حصة وحجم الحصة وكمية الاستهلاك.' });
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
        productName: 'ملصق تغذية (OCR)',
        confidence: 0.7
      };

      await foodLog.setItem(entry.id, entry);

      setMessage({ kind: 'info', text: 'تمت الإضافة بنجاح. سيتم تحويلك للوحة التحكم.' });
      setTimeout(() => navigate('/dashboard', { replace: true }), 500);
    } catch {
      setMessage({ kind: 'error', text: 'حدث خطأ أثناء حفظ سجل الطعام.' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Page>
      <Card>
        <Header>
          <div>
            <h1>تصوير ملصق التغذية</h1>
            <p>
              التقط صورة لملصق التغذية، وسيحلل التطبيق النص تلقائياً. المحاولة الأولى: إنجليزي فقط.
              إذا فشل الاستخراج، سيحاول مرة أخرى بالإنجليزي + العربي.
            </p>
          </div>
          <Actions>
            <Button $variant="ghost" onClick={() => navigate('/dashboard', { replace: true })}>
              رجوع للوحة التحكم
            </Button>
            {!cameraActive ? (
              <Button $variant="primary" onClick={startCamera}>تشغيل الكاميرا</Button>
            ) : (
              <Button $variant="danger" onClick={stopCamera}>إيقاف الكاميرا</Button>
            )}
          </Actions>
        </Header>

        <CameraWrap>
          <Video ref={videoRef} autoPlay playsInline muted />
          <Canvas ref={canvasRef} />
        </CameraWrap>

        {cameraActive && (
          <Box style={{ marginTop: 12 }}>
            <Button
              $variant="primary"
              onClick={captureAndOCR}
              disabled={ocrRunning}
              style={{ width: '100%' }}
            >
              {ocrRunning ? `جاري التحليل… ${ocrProgress}%` : 'التقاط وتحليل'}
            </Button>
          </Box>
        )}

        {message && <Message $kind={message.kind}>{message.text}</Message>}

        {ocrMode && (
          <Box>
            <h2>
              وضع OCR المستخدم:
              <Badge $color={ocrMode === 'eng' ? 'green' : 'orange'}>
                {ocrMode === 'eng' ? 'English' : 'English + Arabic'}
              </Badge>
            </h2>

            {rawText && (
              <RawText>
                <summary>عرض النص الخام (Raw OCR Text)</summary>
                <pre>{rawText}</pre>
              </RawText>
            )}
          </Box>
        )}

        {(caloriesPerServing !== '' || rawText) && (
          <Box>
            <h2>مراجعة وتعديل البيانات المستخرجة</h2>
            <p className="muted">يرجى التأكد من صحة الحقول التالية وتعديلها إذا لزم الأمر.</p>

            <TwoCol>
              <div>
                <Label>السعرات لكل حصة (Calories / Serving) *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="مثال: 120"
                  value={caloriesPerServing}
                  onChange={(e) => setCaloriesPerServing(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <Label>عدد الحصص في العبوة (Servings / Container)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="مثال: 2"
                  value={servingsPerContainer}
                  onChange={(e) => setServingsPerContainer(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </TwoCol>

            <TwoCol>
              <div>
                <Label>حجم الحصة - قيمة (Serving Size - Value) *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="مثال: 250"
                  value={servingSizeValue}
                  onChange={(e) => setServingSizeValue(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <Label>حجم الحصة - وحدة (Serving Size - Unit) *</Label>
                <Select value={servingSizeUnit} onChange={(e) => setServingSizeUnit(e.target.value as 'ml' | 'g')}>
                  <option value="ml">ml (مل)</option>
                  <option value="g">g (جم)</option>
                </Select>
              </div>
            </TwoCol>

            <TwoCol>
              <div>
                <Label>Protein / Serving (g)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="مثال: 8"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Carbs / Serving (g)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="مثال: 25"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </TwoCol>

            <TwoCol>
              <div>
                <Label>Fats / Serving (g)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="مثال: 3"
                  value={fats}
                  onChange={(e) => setFats(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </TwoCol>
          </Box>
        )}

        {(caloriesPerServing !== '' || rawText) && (
          <Box>
            <h2>كمية الاستهلاك</h2>
            <p className="muted">أدخل عدد الحصص المستهلكة أو الكمية بالـ ml/g.</p>

            <TwoCol>
              <div>
                <Label>عدد الحصص المستهلكة (Servings Consumed)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="مثال: 1"
                  value={consumedServings}
                  onChange={(e) => setConsumedServings(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>أو الكمية بالـ {servingSizeUnit} (Quantity)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder={`مثال: ${servingSizeValue || 250}`}
                  value={consumedQuantity}
                  onChange={(e) => setConsumedQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </TwoCol>

            <TwoCol>
              <div>
                <Label>إجمالي السعرات المحسوبة (Total Calories)</Label>
                <Input readOnly value={computeTotalCalories() ?? '—'} />
              </div>
              <div style={{ display: 'flex', alignItems: 'end', gap: 10, flexWrap: 'wrap' }}>
                <Button $variant="primary" onClick={addToToday} disabled={adding || !computeTotalCalories()}>
                  {adding ? 'جاري الإضافة…' : 'أضف لاستهلاك اليوم'}
                </Button>
                <Button $variant="ghost" onClick={startCamera}>تصوير ملصق آخر</Button>
              </div>
            </TwoCol>

            <Message $kind="info" style={{ marginTop: 12 }}>
              نصيحة: ثبّت الهاتف جيداً وتأكد من وضوح الملصق. إذا كانت النتائج غير دقيقة، قم بالتعديل اليدوي.
            </Message>
          </Box>
        )}
      </Card>
    </Page>
  );
};
