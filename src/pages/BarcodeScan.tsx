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
  inline-size: min(860px, 100%);
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
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
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

  /* Quagga inserts a video/canvas inside */
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
  ${({ $kind }) =>
    $kind === 'error'
      ? `background: rgba(231, 76, 60, 0.10); border: 1px solid rgba(231, 76, 60, 0.22); color: #b42318;`
      : `background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.10); color: #374151;`}
`;

const ProductBox = styled.div`
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

const QtyRow = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
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
  const [locked, setLocked] = useState(false); // throttle detections
  const [barcode, setBarcode] = useState<string | null>(null);

  const [info, setInfo] = useState<ProductInfo | null>(null);
  const [qty, setQty] = useState<number>(100);
  const [message, setMessage] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);
  const [adding, setAdding] = useState(false);

  const kcalForQty = useMemo(() => {
    if (!info?.kcal100g || !Number.isFinite(qty) || qty <= 0) return null;
    return Math.round((qty / 100) * info.kcal100g);
  }, [info?.kcal100g, qty]);

  const stop = async () => {
    try {
      Quagga.offDetected(onDetected);
    } catch {}
    try {
      Quagga.stop();
    } catch {}
    setScanning(false);
  };

  const onDetected = (data: any) => {
    if (locked) return;
    const code = data?.codeResult?.code;
    if (!code) return;
    setLocked(true);
    setBarcode(code);
    setMessage({ kind: 'info', text: `تم التقاط الباركود: ${code}` });
    stop();
  };

  const start = async () => {
    setMessage(null);
    setBarcode(null);
    setInfo(null);
    setLocked(false);

    const target = targetRef.current;
    if (!target) {
      setMessage({ kind: 'error', text: 'تعذر بدء الكاميرا: لم يتم العثور على عنصر العرض.' });
      return;
    }

    // Important: Quagga needs a real DOM node to inject video/canvas into
    try {
      await new Promise<void>((resolve, reject) => {
        Quagga.init(
          {
            inputStream: {
              type: 'LiveStream',
              target,
              constraints: {
                facingMode: 'environment',
              }
            },
            locator: { patchSize: 'medium', halfSample: true },
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
      setMessage({ kind: 'info', text: 'وجّه الكاميرا نحو الباركود حتى يتم التقاطه.' });
    } catch (e: any) {
      setScanning(false);
      setMessage({
        kind: 'error',
        text:
          'فشل تشغيل الكاميرا. تأكد من منح إذن الكاميرا وأنك على HTTPS (Netlify).'
      });
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      if (!barcode) return;

      setInfo(null);
      setMessage({ kind: 'info', text: 'جاري جلب بيانات المنتج…' });

      try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`);
        if (!res.ok) throw new Error('فشل الطلب من قاعدة بيانات المنتجات.');
        const json = await res.json();

        if (!json?.product) {
          setMessage({ kind: 'error', text: 'لم يتم العثور على المنتج في قاعدة البيانات.' });
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

        setMessage({ kind: 'info', text: 'تم جلب بيانات المنتج. أدخل الكمية ثم أضفها لسجل اليوم.' });
      } catch {
        setMessage({ kind: 'error', text: 'تعذر جلب بيانات المنتج. جرّب مرة أخرى.' });
      }
    }

    fetchProduct();
  }, [barcode]);

  const addToToday = async () => {
    if (!info) return;
    if (!kcalForQty) {
      setMessage({ kind: 'error', text: 'لا يمكن إضافة هذا المنتج لأن بيانات السعرات غير متوفرة أو الكمية غير صحيحة.' });
      return;
    }

    setAdding(true);
    try {
      const { foodLog } = await initDatabase();

      const entry: FoodLogEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        mealType: 'snack',
        detectedCalories: kcalForQty,
        protein: info.protein100g != null ? Math.round((qty / 100) * info.protein100g) : undefined,
        carbs: info.carbs100g != null ? Math.round((qty / 100) * info.carbs100g) : undefined,
        fats: info.fats100g != null ? Math.round((qty / 100) * info.fats100g) : undefined,
        servingSize: qty,
        productName: info.name,
        barcode: info.barcode,
        confidence: 1
      };

      await foodLog.setItem(entry.id, entry);

      setMessage({ kind: 'info', text: 'تمت الإضافة لسجل اليوم بنجاح. سيتم تحويلك للوحة التحكم.' });

      // Go back to dashboard
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
            <p>امسح باركود المنتج لجلب السعرات وإضافتها لاستهلاكك اليومي.</p>
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

        <ScannerWrap>
          <ScannerTarget ref={targetRef} />
        </ScannerWrap>

        {message && <Message $kind={message.kind}>{message.text}</Message>}

        {info && (
          <ProductBox>
            <h2>{info.name}</h2>
            <p className="muted">Barcode: {info.barcode}</p>

            <Grid>
              <Metric>
                <div className="k">Calories / 100g</div>
                <div className="v">{info.kcal100g ?? '—'}</div>
              </Metric>
              <Metric>
                <div className="k">Protein / 100g</div>
                <div className="v">{info.protein100g ?? '—'}</div>
              </Metric>
              <Metric>
                <div className="k">Carbs / 100g</div>
                <div className="v">{info.carbs100g ?? '—'}</div>
              </Metric>
              <Metric>
                <div className="k">Fats / 100g</div>
                <div className="v">{info.fats100g ?? '—'}</div>
              </Metric>
            </Grid>

            <QtyRow>
              <div>
                <div style={{ fontWeight: 900, marginBottom: 6, color: '#111827' }}>الكمية (جرام)</div>
                <Input
                  type="number"
                  min="1"
                  value={Number.isFinite(qty) ? qty : 100}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </div>
              <div>
                <div style={{ fontWeight: 900, marginBottom: 6, color: '#111827' }}>السعرات لهذه الكمية</div>
                <Input
                  readOnly
                  value={kcalForQty != null ? `${kcalForQty} kcal` : '—'}
                />
              </div>
            </QtyRow>

            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button $variant="primary" onClick={addToToday} disabled={adding || !kcalForQty}>
                {adding ? 'جاري الإضافة…' : 'أضف لاستهلاك اليوم'}
              </Button>
              <Button $variant="ghost" onClick={start}>مسح منتج آخر</Button>
            </div>
          </ProductBox>
        )}
      </Card>
    </Page>
  );
};
