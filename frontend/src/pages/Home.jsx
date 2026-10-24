import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import categoryApi from '../api/categoryApi.js';
import productApi from '../api/productApi.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import Pagination from '../components/Pagination.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { getApiError } from '../utils/apiError.js';

const PAGE_SIZE = 12;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_DIR = 'desc';
const SORTS = [
  { label: 'Newest', sortBy: 'createdAt', sortDir: 'desc' },
  { label: 'Price: low to high', sortBy: 'price', sortDir: 'asc' },
  { label: 'Price: high to low', sortBy: 'price', sortDir: 'desc' },
  { label: 'Name: A to Z', sortBy: 'name', sortDir: 'asc' },
];

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : fallback;
}

function normalizeCatalogParams(source) {
  const normalized = new URLSearchParams();
  const page = positiveInteger(source.get('page'), '1');
  const allowedSort = SORTS.find((sort) => (
    sort.sortBy === source.get('sortBy') && sort.sortDir === source.get('sortDir')
  )) || SORTS[0];

  normalized.set('page', page);
  normalized.set('size', String(PAGE_SIZE));
  normalized.set('sortBy', allowedSort.sortBy);
  normalized.set('sortDir', allowedSort.sortDir);
  normalized.set('inStock', source.get('inStock') === 'true' ? 'true' : 'false');

  const keyword = (source.get('keyword') || '').trim().slice(0, 100);
  const categoryId = source.get('categoryId');
  if (keyword) normalized.set('keyword', keyword);
  if (/^[1-9]\d*$/.test(categoryId || '')) normalized.set('categoryId', categoryId);

  for (const key of ['minPrice', 'maxPrice']) {
    const value = (source.get(key) || '').trim();
    if (value) normalized.set(key, value);
  }

  return normalized;
}

function readPrice(value, label) {
  if (!value) return { value: undefined, error: '' };
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: undefined, error: `${label} must be a valid price of 0 or more.` };
  }
  return { value: parsed, error: '' };
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const normalizedParams = useMemo(
    () => normalizeCatalogParams(new URLSearchParams(queryString)),
    [queryString],
  );
  const normalizedQuery = normalizedParams.toString();
  const isQueryReady = normalizedQuery === queryString;

  const filters = useMemo(() => ({
    page: Number(normalizedParams.get('page')) || 1,
    keyword: normalizedParams.get('keyword') || '',
    categoryId: normalizedParams.get('categoryId') || '',
    minPrice: normalizedParams.get('minPrice') || '',
    maxPrice: normalizedParams.get('maxPrice') || '',
    inStock: normalizedParams.get('inStock') === 'true',
    sortBy: normalizedParams.get('sortBy') || DEFAULT_SORT_BY,
    sortDir: normalizedParams.get('sortDir') || DEFAULT_SORT_DIR,
  }), [normalizedQuery, normalizedParams]);

  const [searchInput, setSearchInput] = useState(filters.keyword);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [categoryRetry, setCategoryRetry] = useState(0);
  const [result, setResult] = useState({ query: null, page: null, error: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const requestId = useRef(0);
  const keywordFromUrl = filters.keyword;

  useEffect(() => {
    if (!isQueryReady) {
      setSearchParams(normalizedParams, { replace: true });
    }
  }, [isQueryReady, normalizedParams, setSearchParams]);

  useEffect(() => {
    setSearchInput(keywordFromUrl);
  }, [keywordFromUrl]);

  const updateQuery = useCallback((changes, resetPage = true) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === undefined || value === '') next.delete(key);
        else next.set(key, String(value));
      }
      next.set('size', String(PAGE_SIZE));
      if (resetPage) next.set('page', '1');
      return next;
    });
  }, [setSearchParams]);

  useEffect(() => {
    if (searchInput.trim() === keywordFromUrl) return undefined;

    const timer = window.setTimeout(() => {
      updateQuery({ keyword: searchInput.trim() || null });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput, keywordFromUrl, updateQuery]);

  useEffect(() => {
    const controller = new AbortController();
    setCategoriesLoading(true);
    setCategoriesError('');

    categoryApi.getCategories({ signal: controller.signal })
      .then(({ data }) => setCategories(data))
      .catch((error) => {
        if (controller.signal.aborted) return;
        const resultError = getApiError(error, 'Could not load product categories.');
        setCategoriesError(resultError.message);
        toast.error(resultError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setCategoriesLoading(false);
      });

    return () => controller.abort();
  }, [categoryRetry]);

  const minimum = readPrice(filters.minPrice, 'Minimum price');
  const maximum = readPrice(filters.maxPrice, 'Maximum price');
  const priceError = minimum.error || maximum.error || (
    minimum.value !== undefined && maximum.value !== undefined && minimum.value > maximum.value
      ? 'Minimum price must be less than or equal to maximum price.'
      : ''
  );

  useEffect(() => {
    if (!isQueryReady) return undefined;

    const currentRequest = ++requestId.current;
    setResult({ query: null, page: null, error: '' });
    setIsLoading(true);

    if (priceError) {
      setResult({ query: queryString, page: null, error: '' });
      setIsLoading(false);
      return () => {
        if (requestId.current === currentRequest) requestId.current += 1;
      };
    }

    const params = {
      page: filters.page - 1,
      size: PAGE_SIZE,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      inStock: filters.inStock,
    };
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.categoryId) params.categoryId = Number(filters.categoryId);
    if (minimum.value !== undefined) params.minPrice = minimum.value;
    if (maximum.value !== undefined) params.maxPrice = maximum.value;

    productApi.getProducts(params)
      .then(({ data }) => {
        if (requestId.current === currentRequest) {
          setResult({ query: queryString, page: data, error: '' });
        }
      })
      .catch((error) => {
        if (requestId.current !== currentRequest) return;
        const resultError = getApiError(error, 'Could not load products.');
        setResult({ query: queryString, page: null, error: resultError.message });
        toast.error(resultError.message);
      })
      .finally(() => {
        if (requestId.current === currentRequest) setIsLoading(false);
      });

    return () => {
      if (requestId.current === currentRequest) requestId.current += 1;
    };
  }, [filters, isQueryReady, maximum.value, minimum.value, priceError, queryString, retryCount]);

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({
      page: '1',
      size: String(PAGE_SIZE),
      sortBy: DEFAULT_SORT_BY,
      sortDir: DEFAULT_SORT_DIR,
      inStock: 'false',
    });
  };

  const submitSearch = (event) => {
    event.preventDefault();
    updateQuery({ keyword: searchInput.trim() || null });
  };

  const changeSort = (event) => {
    const [sortBy, sortDir] = event.target.value.split(':');
    updateQuery({ sortBy, sortDir });
  };

  const selectedSort = `${filters.sortBy}:${filters.sortDir}`;
  const hasActiveFilters = Boolean(
    filters.keyword || filters.categoryId || filters.minPrice || filters.maxPrice || filters.inStock
    || selectedSort !== `${DEFAULT_SORT_BY}:${DEFAULT_SORT_DIR}` || filters.page > 1,
  );
  const currentResult = result.query === queryString;
  const showLoader = isLoading || (!currentResult && isQueryReady);

  return (
    <div className="catalog-page container py-4 py-lg-5">
      <section className="catalog-heading">
        <div>
          <span className="auth-kicker">MINIMART COLLECTION</span>
          <h1>Find your everyday favorites.</h1>
          <p>Thoughtful essentials, ready for your routine.</p>
        </div>
        {currentResult && result.page && (
          <span className="catalog-result-count">{result.page.totalElements} {result.page.totalElements === 1 ? 'product' : 'products'}</span>
        )}
      </section>

      <section className="catalog-filter-panel" aria-label="Product filters">
        <form className="catalog-search" onSubmit={submitSearch} role="search">
          <label className="visually-hidden" htmlFor="catalog-keyword">Search products</label>
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            id="catalog-keyword"
            className="form-control"
            type="search"
            maxLength={100}
            placeholder="Search products…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button className="btn btn-primary" type="submit">Search</button>
        </form>

        <div className="row g-3 align-items-end catalog-filters">
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label" htmlFor="catalog-category">Category</label>
            <select
              className="form-select"
              id="catalog-category"
              value={filters.categoryId}
              disabled={categoriesLoading}
              onChange={(event) => updateQuery({ categoryId: event.target.value || null })}
            >
              <option value="">{categoriesLoading ? 'Loading categories…' : 'All categories'}</option>
              {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
            </select>
          </div>
          <div className="col-6 col-sm-3 col-lg-2">
            <label className="form-label" htmlFor="catalog-min-price">Min price</label>
            <div className="price-input-wrap"><span aria-hidden="true">₹</span><input
              className="form-control"
              id="catalog-min-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={filters.minPrice}
              onChange={(event) => updateQuery({ minPrice: event.target.value || null })}
            /></div>
          </div>
          <div className="col-6 col-sm-3 col-lg-2">
            <label className="form-label" htmlFor="catalog-max-price">Max price</label>
            <div className="price-input-wrap"><span aria-hidden="true">₹</span><input
              className="form-control"
              id="catalog-max-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Any"
              value={filters.maxPrice}
              onChange={(event) => updateQuery({ maxPrice: event.target.value || null })}
            /></div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label" htmlFor="catalog-sort">Sort by</label>
            <select className="form-select" id="catalog-sort" value={selectedSort} onChange={changeSort}>
              {SORTS.map((sort) => <option key={`${sort.sortBy}:${sort.sortDir}`} value={`${sort.sortBy}:${sort.sortDir}`}>{sort.label}</option>)}
            </select>
          </div>
          <div className="col-12 col-sm-6 col-lg-2">
            <div className="form-check in-stock-filter">
              <input
                className="form-check-input"
                type="checkbox"
                id="catalog-in-stock"
                checked={filters.inStock}
                onChange={(event) => updateQuery({ inStock: event.target.checked })}
              />
              <label className="form-check-label" htmlFor="catalog-in-stock">In stock only</label>
            </div>
          </div>
        </div>

        {categoriesError && (
          <div className="category-load-error" role="alert">
            <span>{categoriesError}</span>
            <button className="btn btn-sm btn-link" type="button" onClick={() => setCategoryRetry((value) => value + 1)}>Retry categories</button>
          </div>
        )}
        {hasActiveFilters && <button className="btn btn-link clear-filter-link" type="button" onClick={clearFilters}>Clear all filters</button>}
      </section>

      <section className="catalog-results" aria-live="polite">
        {priceError && <ErrorMessage message={priceError} />}

        {showLoader && !priceError && <Loader label="Loading products…" />}

        {!showLoader && !priceError && currentResult && result.error && (
          <div className="catalog-error-state">
            <ErrorMessage message={result.error} />
            <button className="btn btn-outline-primary home-login" type="button" onClick={() => setRetryCount((value) => value + 1)}>Retry</button>
          </div>
        )}

        {!showLoader && !priceError && currentResult && !result.error && result.page?.content?.length === 0 && (
          <div className="catalog-empty-state">
            <span className="empty-basket" aria-hidden="true">⌕</span>
            <h2>No products found</h2>
            <p>Try changing your search or filters to find what you need.</p>
            <button className="btn btn-primary signup-button" type="button" onClick={clearFilters}>Clear filters</button>
          </div>
        )}

        {!showLoader && !priceError && currentResult && !result.error && result.page?.content?.length > 0 && (
          <>
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-3 g-lg-4">
              {result.page.content.map((product) => (
                <div className="col" key={product.id}><ProductCard product={product} /></div>
              ))}
            </div>
            <Pagination
              currentPage={filters.page}
              totalPages={result.page.totalPages}
              onPageChange={(page) => updateQuery({ page }, false)}
            />
          </>
        )}
      </section>
    </div>
  );
}
