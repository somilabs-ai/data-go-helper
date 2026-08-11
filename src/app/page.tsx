'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Key,
  Play,
  CheckCircle2,
  Clock,
  RefreshCw,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Terminal,
  Copy,
  Eye,
  EyeOff,
  Server,
  Database,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface ApiItem {
  id: string;
  title: string;
  provider: string;
  type?: string;
  description?: string;
  modifiedAt?: string;
  url?: string;
  category?: string;
}

interface AppliedApiItem {
  id: string;
  title: string;
  provider: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_APPLIED';
  encodingKey?: string;
  decodingKey?: string;
  appliedAt?: string;
  limitPerDay?: string;
  endpointUrl?: string;
  usagePurpose?: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'apply' | 'vault' | 'playground'>('catalog');

  // Catalog State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [catalogItems, setCatalogItems] = useState<ApiItem[]>([]);
  const [presets, setPresets] = useState<ApiItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Cart & Vault State
  const [cart, setCart] = useState<ApiItem[]>([]);
  const [appliedApis, setAppliedApis] = useState<AppliedApiItem[]>([]);
  const [sessionLoggedIn, setSessionLoggedIn] = useState(false);

  // Apply Agent State
  const [usagePurpose, setUsagePurpose] = useState('공공데이터 기반 자동화 분석 및 서비스 테스트');
  const [isApplying, setIsApplying] = useState(false);
  const [applyLogs, setApplyLogs] = useState<string[]>([]);

  // Key Vault & Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [showKeysMap, setShowKeysMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Playground State
  const [selectedApiForTest, setSelectedApiForTest] = useState<AppliedApiItem | null>(null);
  const [testEndpoint, setTestEndpoint] = useState('');
  const [testKeyType, setTestKeyType] = useState<'encoding' | 'decoding'>('decoding');
  const [testParams, setTestParams] = useState<{ key: string; value: string }[]>([
    { key: 'pageNo', value: '1' },
    { key: 'numOfRows', value: '10' },
    { key: 'dataType', value: 'JSON' }
  ]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);

  // Manual Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualProvider, setManualProvider] = useState('');
  const [manualEncodingKey, setManualEncodingKey] = useState('');
  const [manualDecodingKey, setManualDecodingKey] = useState('');
  const [manualEndpoint, setManualEndpoint] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    fetchCatalog();
    fetchVaultData();
    checkSessionStatus();
  }, []);

  const fetchCatalog = async (query = '', category = 'ALL') => {
    setLoadingCatalog(true);
    try {
      const res = await fetch(`/api/catalog?q=${encodeURIComponent(query)}&category=${category}`);
      const json = await res.json();
      if (json.success) {
        setCatalogItems(json.data || []);
        if (json.presets) setPresets(json.presets);
      }
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const fetchVaultData = async () => {
    try {
      const res = await fetch('/api/vault');
      const json = await res.json();
      if (json.success && json.data) {
        setCart(json.data.cart || []);
        setAppliedApis(json.data.appliedApis || []);
        setSessionLoggedIn(json.data.session?.isLoggedIn || false);

        if (json.data.appliedApis?.length > 0 && !selectedApiForTest) {
          const first = json.data.appliedApis[0];
          setSelectedApiForTest(first);
          setTestEndpoint(first.endpointUrl || 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst');
        }
      }
    } catch (err) {
      console.error('Failed to fetch vault data:', err);
    }
  };

  const checkSessionStatus = async () => {
    try {
      const res = await fetch('/api/automation/login');
      const json = await res.json();
      if (json.success) {
        setSessionLoggedIn(json.isLoggedIn);
      }
    } catch (e) {
      console.error('Session check failed:', e);
    }
  };

  const handleAddToCart = async (item: ApiItem) => {
    const exists = cart.some(c => c.id === item.id);
    if (exists) return;

    const newCart = [...cart, item];
    setCart(newCart);

    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ADD_CART', items: [item] })
    });
  };

  const handleRemoveFromCart = async (id: string) => {
    const newCart = cart.filter(c => c.id !== id);
    setCart(newCart);

    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'REMOVE_CART', id })
    });
  };

  const handleInteractiveLogin = async () => {
    try {
      setApplyLogs(prev => [...prev, '🌐 브라우저 세션 동기화 창을 실행합니다... (공공데이터포털 로그인 필요)']);
      const res = await fetch('/api/automation/login', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSessionLoggedIn(true);
        setApplyLogs(prev => [...prev, '✅ 로그인 세션 쿠키 수집이 정상 완료되었습니다!']);
      } else {
        setApplyLogs(prev => [...prev, `⚠️ ${json.message}`]);
      }
    } catch (err: any) {
      setApplyLogs(prev => [...prev, `❌ 세션 수집 중 오류: ${err.message}`]);
    }
  };

  const handleBulkApply = async () => {
    if (cart.length === 0) return;

    setIsApplying(true);
    setApplyLogs([
      '🚀 1-Click 일괄 자동 신청 프로세스를 시작합니다...',
      `📋 신청 대상 API 총 ${cart.length}개`,
      `📝 입력된 활용 목적: "${usagePurpose}"`
    ]);

    try {
      const res = await fetch('/api/automation/apply-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, usagePurpose })
      });
      const json = await res.json();

      if (json.success) {
        if (json.jobs && Array.isArray(json.jobs)) {
          json.jobs.forEach((j: any) => {
            setApplyLogs(prev => [...prev, `[${j.status}] ${j.title}: ${j.message || '완료'}`]);
          });
        }
        setApplyLogs(prev => [...prev, '🎉 모든 선택한 API의 일괄 신청 및 인증키 저장이 완료되었습니다!']);
        setCart([]);
        if (json.appliedApis) setAppliedApis(json.appliedApis);
      } else {
        setApplyLogs(prev => [...prev, `❌ 신청 오류: ${json.message}`]);
      }
    } catch (err: any) {
      setApplyLogs(prev => [...prev, `❌ 네트워크 예외: ${err.message}`]);
    } finally {
      setIsApplying(false);
    }
  };

  const handleSyncMyPage = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/automation/sync-keys', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.appliedApis) {
        setAppliedApis(json.appliedApis);
        alert('마이페이지의 발급 완료된 API 및 인증키가 최신 상태로 동기화되었습니다!');
      } else {
        alert(json.message || '동기화 실패');
      }
    } catch (e: any) {
      alert(`동기화 중 오류 발생: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualAddApi = async () => {
    if (!manualTitle) return;
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_APPLIED_MANUAL',
          item: {
            title: manualTitle,
            provider: manualProvider || '개별 등록 기관',
            encodingKey: manualEncodingKey,
            decodingKey: manualDecodingKey,
            endpointUrl: manualEndpoint
          }
        })
      });
      const json = await res.json();
      if (json.success && json.appliedApis) {
        setAppliedApis(json.appliedApis);
        setShowAddModal(false);
        setManualTitle('');
        setManualEncodingKey('');
        setManualDecodingKey('');
        setManualEndpoint('');
      }
    } catch (e: any) {
      alert('추가 실패: ' + e.message);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKeysMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRunPlaygroundTest = async () => {
    if (!testEndpoint) {
      alert('엔드포인트 URL을 입력해 주세요.');
      return;
    }

    setIsTesting(true);
    setTestResponse(null);

    const apiKey = testKeyType === 'decoding'
      ? selectedApiForTest?.decodingKey
      : selectedApiForTest?.encodingKey;

    const paramsObj: Record<string, string> = {};
    testParams.forEach(p => {
      if (p.key.trim()) paramsObj[p.key.trim()] = p.value;
    });

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointUrl: testEndpoint,
          apiKey,
          keyType: testKeyType,
          params: paramsObj
        })
      });
      const json = await res.json();
      setTestResponse(json);
    } catch (err: any) {
      setTestResponse({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Glass Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 glow-indigo">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-300 bg-clip-text text-transparent">
                  data.go.kr API 버틀러
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Full-Stack v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">공공데이터포털 오픈API 자동 신청 및 키 통합 관리 플랫폼</p>
            </div>
          </div>

          {/* Tab Controls */}
          <nav className="flex items-center gap-1 sm:gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'catalog'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>카탈로그 탐색</span>
            </button>

            <button
              onClick={() => setActiveTab('apply')}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'apply'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>일괄 자동 신청</span>
              {cart.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-pink-500 text-white animate-pulse">
                  {cart.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'vault'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>인증키 Vault</span>
              {appliedApis.length > 0 && (
                <span className="ml-0.5 text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {appliedApis.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('playground')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'playground'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>API 샌드박스</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ================= TAB 1: CATALOG EXPLORER ================= */}
        {activeTab === 'catalog' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Hero Banner */}
            <div className="relative rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 border border-indigo-500/20 p-6 sm:p-8 overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  공공데이터 포털 메타데이터 연동
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  필요한 OpenAPI를 검색하고 <span className="gradient-text">장바구니에 담아 1-Click 신청</span>하세요
                </h1>
                <p className="text-sm text-slate-300">
                  수십 개의 공공데이터를 하나씩 수동으로 신청할 필요 없이, 검색 후 선택하여 일괄 자동 신청 및 인증키 수집을 원스톱으로 처리합니다.
                </p>
              </div>
            </div>

            {/* Preset Quick Add Buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  자주 쓰이는 인기 공공 OpenAPI 프리셋
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {presets.map((preset, idx) => {
                  const inCart = cart.some(c => c.id === preset.id);
                  return (
                    <div
                      key={`preset-${preset.id}-${idx}`}
                      className="glass-card glass-card-hover rounded-xl p-4 flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {preset.provider}
                          </span>
                          <span className="text-[11px] text-slate-400">{preset.category}</span>
                        </div>
                        <h4 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {preset.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2">{preset.description}</p>
                      </div>

                      <button
                        onClick={() => handleAddToCart(preset)}
                        disabled={inCart}
                        className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          inCart
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            : 'bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-md hover:shadow-indigo-500/20'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>장바구니에 담김</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>신청 장바구니에 추가</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real Search Section */}
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="API명, 제공기관, 키워드 검색 (예: 기상청, 아파트, 도로, 보건...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchCatalog(searchQuery, selectedCategory)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                  />
                </div>
                <button
                  onClick={() => fetchCatalog(searchQuery, selectedCategory)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>검색</span>
                </button>
              </div>

              {/* Search Results Grid */}
              {loadingCatalog ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-sm text-slate-400">공공데이터 메타데이터 조회 중...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catalogItems.map((item, idx) => {
                    const inCart = cart.some(c => c.id === item.id);
                    return (
                      <div key={`catalog-${item.id}-${idx}`} className="glass-card rounded-xl p-4 flex flex-col justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-indigo-400 font-medium">{item.provider}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">{item.type || 'OpenAPI'}</span>
                          </div>
                          <h4 className="font-semibold text-sm text-slate-200">{item.title}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                          <a
                            href={item.url || `https://www.data.go.kr/data/${item.id}/openapi.do`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1"
                          >
                            <span>data.go.kr 상세</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={inCart}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                              inCart
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                          >
                            {inCart ? '담김' : '+ 장바구니'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: BULK APPLY AGENT ================= */}
        {activeTab === 'apply' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Cart & Config */}
              <div className="lg:col-span-1 space-y-6">
                {/* Session Status Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  sessionLoggedIn
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${sessionLoggedIn ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">포털 로그인 세션</h4>
                      <p className="text-xs text-slate-300">
                        {sessionLoggedIn ? '유효한 로그인 세션 존재함' : '최초 1회 로그인 수집 필요'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleInteractiveLogin}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200"
                  >
                    세션 연동
                  </button>
                </div>

                {/* Purpose Selection */}
                <div className="glass-card rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    공통 활용 목적 설정
                  </h3>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">신청서에 자동 입력될 목적 내용</label>
                    <textarea
                      value={usagePurpose}
                      onChange={(e) => setUsagePurpose(e.target.value)}
                      rows={3}
                      className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['연구 및 데이터 분석용', '서비스 개발 및 테스트', '학술 연구 목적'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setUsagePurpose(p)}
                        className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-[11px] text-slate-300"
                      >
                        + {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cart Summary Card */}
                <div className="glass-card rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-pink-400" />
                      신청 대상 API ({cart.length}개)
                    </h3>
                    {cart.length > 0 && (
                      <button
                        onClick={() => {
                          setCart([]);
                          fetch('/api/vault', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'CLEAR_CART' })
                          });
                        }}
                        className="text-xs text-slate-500 hover:text-rose-400"
                      >
                        비우기
                      </button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      선택된 API가 없습니다.<br />[카탈로그 탐색] 탭에서 신청할 API를 추가하세요.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {cart.map((item, idx) => (
                        <div key={`cart-${item.id}-${idx}`} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="truncate pr-2">
                            <p className="font-medium text-slate-200 truncate">{item.title}</p>
                            <span className="text-[10px] text-slate-400">{item.provider}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleBulkApply}
                    disabled={cart.length === 0 || isApplying}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {isApplying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>자동 신청 진행 중...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        <span>1-Click 일괄 자동 신청 실행</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Realtime Terminal Log */}
              <div className="lg:col-span-2">
                <div className="glass-card rounded-xl p-5 space-y-4 h-full flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-semibold text-slate-200">Playwright 자동화 실행 실시간 로그</h3>
                    </div>
                    <span className="text-[11px] text-slate-500">Auto-Log Console</span>
                  </div>

                  <div className="flex-1 bg-slate-950 rounded-lg p-4 font-mono text-xs space-y-2 border border-slate-900 overflow-y-auto min-h-[360px]">
                    {applyLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 py-12">
                        <Terminal className="w-8 h-8 opacity-40" />
                        <p>자동 신청을 시작하면 이곳에 실시간 브라우저 실행 로그가 표시됩니다.</p>
                      </div>
                    ) : (
                      applyLogs.map((log, idx) => (
                        <div key={idx} className="leading-relaxed flex items-start gap-2">
                          <span className="text-slate-600 select-none">&gt;</span>
                          <span className={log.includes('❌') ? 'text-rose-400' : log.includes('✅') ? 'text-emerald-400' : 'text-slate-300'}>
                            {log}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: KEY VAULT & MYPAGE SYNC ================= */}
        {activeTab === 'vault' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card rounded-xl p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-400" />
                  보관된 발급 API 및 인증키 관리 Vault
                </h2>
                <p className="text-xs text-slate-400">신청 완료된 OpenAPI의 Encoding/Decoding 인증키와 일일 호출 한도를 관리합니다.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleSyncMyPage}
                  disabled={isSyncing}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>마이페이지 동기화</span>
                </button>

                <a
                  href="/api/vault/export-env"
                  download
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.env 파일 다운로드</span>
                </a>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>수동 추가</span>
                </button>
              </div>
            </div>

            {/* Keys Table */}
            <div className="glass-card rounded-xl overflow-hidden border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">API 서비스명</th>
                      <th className="py-3.5 px-4">제공기관</th>
                      <th className="py-3.5 px-4">상태</th>
                      <th className="py-3.5 px-4">Encoding Key</th>
                      <th className="py-3.5 px-4">Decoding Key</th>
                      <th className="py-3.5 px-4 text-right">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {appliedApis.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          보관된 API 키가 없습니다. [마이페이지 동기화]를 실행하거나 카탈로그에서 자동 신청을 진행해 보세요.
                        </td>
                      </tr>
                    ) : (
                      appliedApis.map((item, idx) => {
                        const isVisible = showKeysMap[item.id] || false;
                        return (
                          <tr key={`vault-${item.id}-${idx}`} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-200 max-w-xs truncate">
                              {item.title}
                              <div className="text-[10px] text-slate-500 font-normal">신청일: {item.appliedAt || '2026-08-01'}</div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">{item.provider}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {item.status}
                              </span>
                            </td>

                            {/* Encoding Key */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-300 truncate max-w-[140px]">
                                  {isVisible ? item.encodingKey : '••••••••••••••••'}
                                </span>
                                {item.encodingKey && (
                                  <button
                                    onClick={() => copyToClipboard(item.encodingKey || '', `enc_${item.id}`)}
                                    className="p-1 text-slate-500 hover:text-indigo-400"
                                    title="Encoding Key 복사"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              {copiedId === `enc_${item.id}` && <span className="text-[10px] text-emerald-400">복사됨!</span>}
                            </td>

                            {/* Decoding Key */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-300 truncate max-w-[140px]">
                                  {isVisible ? item.decodingKey : '••••••••••••••••'}
                                </span>
                                {item.decodingKey && (
                                  <button
                                    onClick={() => copyToClipboard(item.decodingKey || '', `dec_${item.id}`)}
                                    className="p-1 text-slate-500 hover:text-indigo-400"
                                    title="Decoding Key 복사"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              {copiedId === `dec_${item.id}` && <span className="text-[10px] text-emerald-400">복사됨!</span>}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => toggleKeyVisibility(item.id)}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                                title={isVisible ? '숨기기' : '보기'}
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: API PLAYGROUND / REST TESTER ================= */}
        {activeTab === 'playground' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Test Configuration */}
              <div className="lg:col-span-1 glass-card rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  REST API 테스트 요청 설정
                </h3>

                {/* API Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">보관소에서 API 선택</label>
                  <select
                    onChange={(e) => {
                      const found = appliedApis.find(a => a.id === e.target.value);
                      if (found) {
                        setSelectedApiForTest(found);
                        if (found.endpointUrl) setTestEndpoint(found.endpointUrl);
                      }
                    }}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    {appliedApis.map(a => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                </div>

                {/* Key Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">주입할 인증키 종류</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTestKeyType('decoding')}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold border ${
                        testKeyType === 'decoding'
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Decoding Key
                    </button>
                    <button
                      onClick={() => setTestKeyType('encoding')}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold border ${
                        testKeyType === 'encoding'
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Encoding Key
                    </button>
                  </div>
                </div>

                {/* Endpoint URL */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">엔드포인트 URL</label>
                  <input
                    type="text"
                    value={testEndpoint}
                    onChange={(e) => setTestEndpoint(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono"
                  />
                </div>

                {/* Parameters Key-Value List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400">쿼리 파라미터</label>
                    <button
                      onClick={() => setTestParams(prev => [...prev, { key: '', value: '' }])}
                      className="text-[11px] text-indigo-400 hover:underline"
                    >
                      + 파라미터 추가
                    </button>
                  </div>
                  {testParams.map((p, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="key"
                        value={p.key}
                        onChange={(e) => {
                          const updated = [...testParams];
                          updated[idx].key = e.target.value;
                          setTestParams(updated);
                        }}
                        className="w-1/2 p-2 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="value"
                        value={p.value}
                        onChange={(e) => {
                          const updated = [...testParams];
                          updated[idx].value = e.target.value;
                          setTestParams(updated);
                        }}
                        className="w-1/2 p-2 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleRunPlaygroundTest}
                  disabled={isTesting}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
                >
                  {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>CORS 우회 프록시 테스트 실행</span>
                </button>
              </div>

              {/* Right Column: Response Viewer */}
              <div className="lg:col-span-2 glass-card rounded-xl p-5 space-y-4 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    응답 결과 (Pretty Output)
                  </h3>
                  {testResponse && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      testResponse.status === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      HTTP {testResponse.status || 500}
                    </span>
                  )}
                </div>

                <div className="flex-1 bg-slate-950 rounded-lg p-4 font-mono text-xs border border-slate-900 overflow-y-auto min-h-[380px]">
                  {!testResponse ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 py-12">
                      <Server className="w-8 h-8 opacity-40" />
                      <p>좌측에서 [CORS 우회 프록시 테스트 실행] 버튼을 눌러 공공데이터 API를 직접 호출해 보세요.</p>
                    </div>
                  ) : (
                    <pre className="text-emerald-300 whitespace-pre-wrap break-all leading-relaxed">
                      {typeof testResponse.data === 'string'
                        ? testResponse.data
                        : JSON.stringify(testResponse, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 space-y-4 border border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">수동 API 인증키 추가</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">API 서비스명</label>
                <input
                  type="text"
                  placeholder="예: 한국전력공사_전력소비량"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">제공기관</label>
                <input
                  type="text"
                  placeholder="예: 한국전력공사"
                  value={manualProvider}
                  onChange={(e) => setManualProvider(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Encoding Key</label>
                <input
                  type="text"
                  placeholder="인코딩 키"
                  value={manualEncodingKey}
                  onChange={(e) => setManualEncodingKey(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Decoding Key</label>
                <input
                  type="text"
                  placeholder="디코딩 키"
                  value={manualDecodingKey}
                  onChange={(e) => setManualDecodingKey(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleManualAddApi}
                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
