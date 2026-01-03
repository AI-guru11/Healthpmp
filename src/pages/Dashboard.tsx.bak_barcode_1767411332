import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { initDatabase } from '../lib/database/indexeddb';
import { CryptoEngine } from '../lib/crypto/aes-encryption';
import type { UserProfile } from '../types/health';

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
`;

const TitleWrap = styled.div`
  h1 {
    margin: 0;
    font-size: 22px;
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

const Button = styled.button<{ $variant?: 'primary' | 'ghost' }>`
  border: none;
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 700;
  cursor: pointer;
  font-size: 14px;

  ${({ $variant }) =>
    $variant === 'primary'
      ? `
        background: #27ae60;
        color: #fff;
      `
      : `
        background: transparent;
        border: 1px solid rgba(0,0,0,.12);
        color: #111827;
      `}
`;

const Grid = styled.div`
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Metric = styled.div`
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  padding: 14px;

  .k {
    color: #6b7280;
    font-size: 13px;
    font-weight: 700;
  }
  .v {
    margin-top: 8px;
    font-size: 26px;
    font-weight: 800;
    color: #111827;
  }
  .hint {
    margin-top: 6px;
    color: #6b7280;
    font-size: 12px;
  }
`;

const MacroBox = styled.div`
  margin-top: 14px;
  background: rgba(39, 174, 96, 0.10);
  border: 1px solid rgba(39, 174, 96, 0.18);
  border-radius: 14px;
  padding: 14px;

  h2 {
    margin: 0 0 10px;
    font-size: 16px;
    color: #111827;
  }

  .row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;

    @media (max-width: 760px) {
      grid-template-columns: 1fr;
    }
  }

  .item {
    background: #fff;
    border-radius: 12px;
    padding: 12px;
    border: 1px solid rgba(0,0,0,.06);

    .k {
      color: #6b7280;
      font-size: 13px;
      font-weight: 700;
    }
    .v {
      margin-top: 6px;
      font-size: 20px;
      font-weight: 800;
      color: #111827;
    }
    .u {
      color: #6b7280;
      font-size: 12px;
      font-weight: 600;
    }
  }
`;

const Message = styled.p<{ $kind?: 'error' | 'info' }>`
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;

  ${({ $kind }) =>
    $kind === 'error'
      ? `
        background: rgba(231, 76, 60, 0.10);
        border: 1px solid rgba(231, 76, 60, 0.22);
        color: #b42318;
      `
      : `
        background: rgba(0,0,0,0.05);
        border: 1px solid rgba(0,0,0,0.10);
        color: #374151;
      `}
`;

function formatActivity(ar: UserProfile['activityLevel']) {
  switch (ar) {
    case 'sedentary': return 'قليل الحركة';
    case 'light': return 'خفيف';
    case 'moderate': return 'متوسط';
    case 'active': return 'عالي';
    case 'veryActive': return 'عالي جداً';
    default: return 'غير محدد';
  }
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const routeProfileId = params.profileId;

  const resolvedProfileId = useMemo(() => {
    // Supports both /dashboard/:profileId and /dashboard (last saved)
    if (routeProfileId) return routeProfileId;
    const last = localStorage.getItem('healthpmp_last_profile_id');
    return last || null;
  }, [routeProfileId]);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setError(null);
      setProfile(null);

      try {
        if (!resolvedProfileId) {
          throw new Error('لا يوجد ملف محفوظ لعرضه. ارجع وأنشئ ملفك أولاً.');
        }

        const { userProfiles } = await initDatabase();
        const encrypted = await userProfiles.getItem<string>(resolvedProfileId);

        if (!encrypted) {
          throw new Error('لم يتم العثور على بيانات هذا الملف. قد يكون تم حذف التخزين المحلي.');
        }

        const key = await CryptoEngine.deriveKey(`health-coach-${resolvedProfileId}`);
        const decrypted = await CryptoEngine.decrypt(encrypted, key);

        const parsed = JSON.parse(decrypted) as UserProfile;

        if (!alive) return;
        setProfile(parsed);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || 'حدث خطأ أثناء تحميل الملف.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [resolvedProfileId]);

  const onBack = () => navigate('/', { replace: true });

  const onOpenIdRoute = () => {
    if (resolvedProfileId) navigate(`/dashboard/${resolvedProfileId}`, { replace: true });
  };

  return (
    <Page>
      <Card>
        <Header>
          <TitleWrap>
            <h1>لوحة التحكم</h1>
            <p>عرض ملفك الصحي المحفوظ واحتياجك اليومي.</p>
          </TitleWrap>

          <Actions>
            <Button $variant="ghost" onClick={onBack}>تعديل البيانات</Button>
            <Button $variant="primary" onClick={onOpenIdRoute} disabled={!resolvedProfileId}>
              تثبيت رابط الملف
            </Button>
          </Actions>
        </Header>

        {loading && <Message $kind="info">جاري تحميل البيانات…</Message>}
        {!loading && error && <Message $kind="error">{error}</Message>}

        {!loading && profile && (
          <>
            <Grid>
              <Metric>
                <div className="k">BMR</div>
                <div className="v">{profile.bmr}</div>
                <div className="hint">معدل الحرق الأساسي (سعرة/يوم)</div>
              </Metric>

              <Metric>
                <div className="k">TDEE</div>
                <div className="v">{profile.tdee}</div>
                <div className="hint">احتياجك اليومي حسب النشاط (سعرة/يوم)</div>
              </Metric>

              <Metric>
                <div className="k">النشاط</div>
                <div className="v">{formatActivity(profile.activityLevel)}</div>
                <div className="hint">مستوى نشاطك المختار</div>
              </Metric>
            </Grid>

            <MacroBox>
              <h2>الماكروز اليومية</h2>
              <div className="row">
                <div className="item">
                  <div className="k">Protein</div>
                  <div className="v">{profile.macros.protein} <span className="u">g</span></div>
                </div>
                <div className="item">
                  <div className="k">Carbs</div>
                  <div className="v">{profile.macros.carbs} <span className="u">g</span></div>
                </div>
                <div className="item">
                  <div className="k">Fats</div>
                  <div className="v">{profile.macros.fats} <span className="u">g</span></div>
                </div>
              </div>

              <Message $kind="info" style={{ marginTop: 12 }}>
                تم إنشاء الملف بتاريخ: {new Date(profile.createdAt).toLocaleString('ar-SA')}
              </Message>
            </MacroBox>
          </>
        )}
      </Card>
    </Page>
  );
};
