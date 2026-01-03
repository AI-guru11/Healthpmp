import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Quagga from '@ericblade/quagga2';
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

const ScannerWrap = styled.div`
  margin-top: 14px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,.10);
  background: #111;
`;

const ScannerTarget = styled.div`
  inline-size: 100%;
  min-block-size: 360px;

  video, canvas {
    inline-size: 100%;
    block-size: auto;
  }
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

const Grid = styled.div`
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const Metric = styled.div`
  background: rgba(39, 174, 96, 0.08);
  border: 1px solid rgba(39, 174, 96, 0.18);
  border-radius: 12px;
  padding: 10px;

  .k { color: #6b7280; font-size: 12px; font-weight: 800; }
  .v { margin-top: 6px; color: #111827; font-size: 18px; font-weight: 900; }
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

type ProductInfo = {
  barcode: string;
  name: string;
  kcal100g: number | null;
  protein100g: number | null;
  carbs100g: number | null;
  fats100g: number | null;
};

function numOrNull(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export const BarcodeScanPage = () => {
  const navigate = useNavigate();
  const targetRef = useRef<HTMLDivElement | null>(null);

  const [scanning, setScanning] = useState(false);
  const [locked, setLocked] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);

  // إدخال يدوي للباركود (عند فشل الالتقاط)
  const [barcodeInput, setBarcodeInput] = useState('');

  const [info, setInfo] = useState<ProductInfo | null>(null);

  // إدخال يدوي للمنتج (Fallback عندما لا يوجد المنتج في OpenFoodFacts)
  const [manualName, setManualName] = useState('');
  const [manualKcal100g, setManualKcal100g] = useState<number | ''>('');
  const [manualProtein100g, setManualProtein100g] = useState<number | ''>('');
  const [manualCarbs100g, setManualCarbs100g] = useState<number | ''>('');
  const [manualFats100g, setManualFats100g] = useState<number | ''>('');

  const [qty, setQty] = useState<number>(100);
  const [message, setMessage] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);
  const [adding, setAdding] = useState(false);

  const kcal100gEffective = useMemo(() => {
    if (info?.kcal100g != null) return info.kcal100g;
    const v = Number(manualKcal100g);
    return Number.isFinite(v) ? v : null;
  }, [info?.kcal100g, manualKcal100g]);

  const kcalForQty = useMemo(() => {
    if (!kcal100gEffective || !Number.isFinite(qty) || qty <= 0) return null;
    return Math.round((qty / 100) * kcal100gEffective);
  }, [kcal100gEffective, qty]);

  const stop = () => {
    try { Quagga.offDetected(onDetected); } catch {}
    try { Quagga.stop(); } catch {}
    setScanning(false);
  };

  const resetProductStates = () => {
    setInfo(null);
    setManualName('');
    setManualKcal100g('');
    setManualProtein100g('');
    setManualCarbs100g('');
    setManualFats100g('');
  };

  const onDetected = (data: any) => {
    if (locked) return;
    const code = data?.codeResult?.code;
    if (!code) return;
    setLocked(true);
    setBarcode(code);
    setBarcodeInput(code);
    setMessage({ kind: 'info', text: `تم التقاط الباركود: ${code}` });
    stop();
  };

  const start = async () => {
    setMessage(null);
    setBarcode(null);
    setLocked(false);
    resetProductStates();

    const target = targetRef.current;
    if (!target) {
      setMessage({ kind: 'error', text: 'تعذر بدء الكاميرا: لم يتم العثور على عنصر العرض.' });
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        Quagga.init(
          {
            inputStream: {
              type: 'LiveStream',
              target,
              constraints: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            },
            locator: { patchSize: 'large', halfSample: false },
            frequency: 10,
            numOfWorkers: 2,
            decoder: {
              readers: [
                'ean_reader',
                'ean_8_reader',
                'upc_reader',
                'upc_e_reader',
                'code_128_reader'
              ]
            },
            locate: true
          },
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });

      Quagga.onDetected(onDetected);
      Quagga.start();
      setScanning(true);
      setMessage({ kind: 'info', text: 'وجّه الكاميرا نحو الباركود. قرّب الباركود وتجنب اللمعان.' });
    } catch {
      setScanning(false);
      setMessage({
        kind: 'error',
        text: 'فشل تشغيل الكاميرا. تأكد من منح إذن الكاميرا وأنك على HTTPS (Netlify).'
      });
    }
  };

  useEffect(() => {
    return () => { stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      if (!barcode) return;

      resetProductStates();
      setMessage({ kind: 'info', text: 'جاري جلب بيانات المنتج من OpenFoodFacts…' });

      try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`);
        if (!res.ok) throw new Error('فشل الطلب من قاعدة بيانات المنتجات.');
        const json = await res.json();

        if (json?.status !== 1 || !json?.product) {
          setMessage({
            kind: 'error',
            text: 'المنتج غير موجود في OpenFoodFacts (شائع مع منتجات محلية). أدخل السعرات يدوياً ثم أضفه لاستهلاك اليوم.'
          });
          return;
        }

        const p = json.product;
        const nutr = p.nutriments || {};

        const name = (p.product_name || p.product_name_ar || p.brands || 'منتج غير مسمى').toString();

        const kcal100g =
          numOrNull(nutr['energy-kcal_100g']) ??
          numOrNull(nutr['energy-kcal']) ??
          null;

        const protein100g = numOrNull(nutr['proteins_100g']);
        const carbs100g = numOrNull(nutr['carbohydrates_100g']);
        const fats100g = numOrNull(nutr['fat_100g']);

        setInfo({
          barcode,
          name,
          kcal100g,
          protein100g,
          carbs100g,
          fats100g
        });

        if (kcal100g == null) {
          setManualName(name);
          setMessage({
            kind: 'error',
            text: 'تم العثور على المنتج، لكن بيانات السعرات غير متوفرة. أدخل السعرات يدوياً ثم أضفه.'
          });
        } else {
          setMessage({ kind: 'info', text: 'تم جلب بيانات المنتج. أدخل الكمية ثم أضفها لاستهلاك اليوم.' });
        }
      } catch {
        setMessage({ kind: 'error', text: 'تعذر جلب بيانات المنتج. يمكنك الإدخال اليدوي كحل بديل.' });
      }
    }

    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcode]);

  const searchByTypedBarcode = () => {
    const code = barcodeInput.trim();
    if (code.length < 8) {
      setMessage({ kind: 'error', text: 'أدخل باركود صحيح (على الأقل 8 أرقام).' });
      return;
    }
    setLocked(true);
    setBarcode(code);
  };

  const addToToday = async () => {
    const code = barcodeInput.trim();
    if (code.length < 8) {
      setMessage({ kind: 'error', text: 'أدخل باركود صحيح.' });
      return;
    }

    const kcalQty = kcalForQty;
    if (!kcalQty) {
      setMessage({ kind: 'error', text: 'أدخل السعرات لكل 100g + الكمية (جرام) بشكل صحيح.' });
      return;
    }

    const nameEffective = (info?.name || manualName || 'منتج (يدوي)').trim();

    setAdding(true);
    try {
      const { foodLog } = await initDatabase();

      const p100 = info?.protein100g ?? (Number.isFinite(Number(manualProtein100g)) ? Number(manualProtein100g) : null);
      const c100 = info?.carbs100g ?? (Number.isFinite(Number(manualCarbs100g)) ? Number(manualCarbs100g) : null);
      const f100 = info?.fats100g ?? (Number.isFinite(Number(manualFats100g)) ? Number(manualFats100g) : null);

      const entry: FoodLogEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        mealType: 'snack',
        detectedCalories: kcalQty,
        protein: p100 != null ? Math.round((qty / 100) * p100) : undefined,
        carbs: c100 != null ? Math.round((qty / 100) * c100) : undefined,
        fats: f100 != null ? Math.round((qty / 100) * f100) : undefined,
        servingSize: qty,
        productName: nameEffective,
        barcode: code,
        confidence: info ? 1 : 0.6
      };

      await foodLog.setItem(entry.id, entry);

      setMessage({ kind: 'info', text: 'تمت الإضافة بنجاح. سيتم تحويلك للوحة التحكم.' });
      setTimeout(() => navigate('/dashboard', { replace: true }), 400);
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
            <h1>مسح باركود المنتج</h1>
            <p>
              إذا لم يتم العثور على المنتج في قاعدة البيانات (OpenFoodFacts) — وهذا شائع للمنتجات المحلية —
              استخدم الإدخال اليدوي للسعرات ثم أضفه لاستهلاك اليوم.
            </p>
          </div>
          <Actions>
            <Button $variant="ghost" onClick={() => navigate('/dashboard', { replace: true })}>رجوع للوحة التحكم</Button>
            {!scanning ? (
              <Button $variant="primary" onClick={start}>بدء المسح</Button>
            ) : (
              <Button $variant="danger" onClick={stop}>إيقاف</Button>
            )}
          </Actions>
        </Header>

        <Box>
          <h2>إدخال الباركود يدوياً</h2>
          <TwoCol>
            <div>
              <Label>الباركود</Label>
              <Input
                inputMode="numeric"
                placeholder="مثال: 628xxxxxxxxxx"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'end', gap: 10, flexWrap: 'wrap' }}>
              <Button $variant="primary" onClick={searchByTypedBarcode}>بحث بالباركود</Button>
              <Button
                $variant="ghost"
                onClick={() => {
                  setBarcode(null);
                  setLocked(false);
                  resetProductStates();
                  setMessage(null);
                }}
              >
                تفريغ
              </Button>
            </div>
          </TwoCol>
        </Box>

        <ScannerWrap>
          <ScannerTarget ref={targetRef} />
        </ScannerWrap>

        {message && <Message $kind={message.kind}>{message.text}</Message>}

        {(info || barcodeInput.trim().length >= 8) && (
          <Box>
            <h2>بيانات المنتج</h2>
            <p className="muted">Barcode: <b>{barcodeInput.trim() || '—'}</b></p>

            {info && (
              <>
                <p className="muted" style={{ marginTop: 6 }}>الاسم: <b>{info.name}</b></p>
                <Grid>
                  <Metric><div className="k">Calories / 100g</div><div className="v">{info.kcal100g ?? '—'}</div></Metric>
                  <Metric><div className="k">Protein / 100g</div><div className="v">{info.protein100g ?? '—'}</div></Metric>
                  <Metric><div className="k">Carbs / 100g</div><div className="v">{info.carbs100g ?? '—'}</div></Metric>
                  <Metric><div className="k">Fats / 100g</div><div className="v">{info.fats100g ?? '—'}</div></Metric>
                </Grid>
              </>
            )}

            <TwoCol>
              <div>
                <Label>اسم المنتج (اختياري)</Label>
                <Input
                  placeholder="مثال: عصير ليمون"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>
              <div>
                <Label>السعرات لكل 100g (مطلوب إذا لم تتوفر)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="مثال: 45"
                  value={manualKcal100g}
                  onChange={(e) => setManualKcal100g(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </TwoCol>

            <TwoCol>
              <div>
                <Label>Protein / 100g (اختياري)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={manualProtein100g}
                  onChange={(e) => setManualProtein100g(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Carbs / 100g (اختياري)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={manualCarbs100g}
                  onChange={(e) => setManualCarbs100g(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </TwoCol>

            <TwoCol>
              <div>
                <Label>Fats / 100g (اختياري)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={manualFats100g}
                  onChange={(e) => setManualFats100g(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <Label>الكمية (جرام)</Label>
                <Input
                  type="number"
                  min="1"
                  value={Number.isFinite(qty) ? qty : 100}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </div>
            </TwoCol>

            <TwoCol>
              <div>
                <Label>السعرات لهذه الكمية</Label>
                <Input readOnly value={kcalForQty != null ? `${kcalForQty} kcal` : '—'} />
              </div>
              <div style={{ display: 'flex', alignItems: 'end', gap: 10, flexWrap: 'wrap' }}>
                <Button $variant="primary" onClick={addToToday} disabled={adding || !kcalForQty}>
                  {adding ? 'جاري الإضافة…' : 'أضف لاستهلاك اليوم'}
                </Button>
                <Button $variant="ghost" onClick={start}>مسح منتج آخر</Button>
              </div>
            </TwoCol>

            <Message $kind="info" style={{ marginTop: 12 }}>
              تلميح: قرّب الباركود، ثبّت اليد، وتجنب اللمعان. إذا لم يوجد المنتج في OpenFoodFacts، الإدخال اليدوي هو الحل الصحيح.
            </Message>
          </Box>
        )}
      </Card>
    </Page>
  );
};
