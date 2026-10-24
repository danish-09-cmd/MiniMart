 import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getApiError } from '../utils/apiError.js';

const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
};

const ADDRESS_FIELDS = [
  { name: 'fullName', label: 'Full name', required: true, maxLength: 120, autoComplete: 'name' },
  { name: 'phone', label: 'Phone number', required: true, inputMode: 'numeric', maxLength: 10, autoComplete: 'tel' },
  { name: 'line1', label: 'Address line 1', required: true, maxLength: 200, autoComplete: 'address-line1' },
  { name: 'line2', label: 'Address line 2 (optional)', required: false, maxLength: 200, autoComplete: 'address-line2' },
  { name: 'city', label: 'City', required: true, maxLength: 100, autoComplete: 'address-level2' },
  { name: 'state', label: 'State', required: true, maxLength: 100, autoComplete: 'address-level1' },
  { name: 'pincode', label: 'PIN code', required: true, inputMode: 'numeric', maxLength: 6, autoComplete: 'postal-code' },
];

function addressFrom(source) {
  return Object.fromEntries(Object.keys(EMPTY_ADDRESS).map((key) => [key, source?.[key] || '']));
}

function validateAddress(address) {
  const errors = {};
  if (!address.fullName.trim()) errors.fullName = 'Enter the recipient name.';
  else if (address.fullName.length > 120) errors.fullName = 'Name must be 120 characters or fewer.';
  if (!/^\d{10}$/.test(address.phone.trim())) errors.phone = 'Enter a 10-digit phone number.';
  if (!address.line1.trim()) errors.line1 = 'Enter the first address line.';
  else if (address.line1.length > 200) errors.line1 = 'Address line 1 must be 200 characters or fewer.';
  if (address.line2.length > 200) errors.line2 = 'Address line 2 must be 200 characters or fewer.';
  if (!address.city.trim()) errors.city = 'Enter a city.';
  else if (address.city.length > 100) errors.city = 'City must be 100 characters or fewer.';
  if (!address.state.trim()) errors.state = 'Enter a state.';
  else if (address.state.length > 100) errors.state = 'State must be 100 characters or fewer.';
  if (!/^\d{6}$/.test(address.pincode.trim())) errors.pincode = 'Enter a 6-digit PIN code.';
  return errors;
}

export default function AddressForm({
  initialAddress = null,
  title = 'Add an address',
  submitLabel = 'Save address',
  onSubmit,
  onCancel,
  disabled = false,
}) {
  const [form, setForm] = useState(() => addressFrom(initialAddress));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(addressFrom(initialAddress));
    setFieldErrors({});
    setFormError('');
  }, [initialAddress]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clientErrors = validateAddress(form);
    setFieldErrors(clientErrors);
    setFormError('');
    if (Object.keys(clientErrors).length > 0) return;

    setSaving(true);
    try {
      await onSubmit(form);
    } catch (error) {
      const result = getApiError(error, 'Could not save this address.');
      setFieldErrors(result.fieldErrors);
      setFormError(result.message);
      toast.error(result.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="address-form-card" onSubmit={handleSubmit} noValidate>
      <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h2>{title}</h2>
          <p className="mb-0">Fields marked with * are required.</p>
        </div>
        {onCancel && <button className="btn-close" type="button" aria-label="Close address form" onClick={onCancel} disabled={saving || disabled} />}
      </div>
      {formError && <div className="alert alert-danger" role="alert">{formError}</div>}
      <div className="row g-3">
        {ADDRESS_FIELDS.map((field) => {
          const fieldError = fieldErrors[field.name];
          return (
            <div className={`col-12 ${['line1', 'line2'].includes(field.name) ? 'col-md-6' : 'col-md-6 col-lg-4'}`} key={field.name}>
              <label className="form-label" htmlFor={`address-${field.name}`}>
                {field.label}{field.required && <span aria-hidden="true"> *</span>}
              </label>
              <input
                id={`address-${field.name}`}
                className={`form-control${fieldError ? ' is-invalid' : ''}`}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                required={field.required}
                maxLength={field.maxLength}
                inputMode={field.inputMode}
                autoComplete={field.autoComplete}
                disabled={saving || disabled}
                aria-invalid={Boolean(fieldError)}
                aria-describedby={fieldError ? `address-${field.name}-error` : undefined}
              />
              {fieldError && <div className="invalid-feedback" id={`address-${field.name}-error`}>{fieldError}</div>}
            </div>
          );
        })}
      </div>
      <div className="d-flex flex-wrap gap-2 mt-4">
        <button className="btn btn-primary" type="submit" disabled={saving || disabled}>
          {saving ? 'Saving...' : submitLabel}
        </button>
        {onCancel && <button className="btn btn-outline-secondary" type="button" onClick={onCancel} disabled={saving || disabled}>Cancel</button>}
      </div>
    </form>
  );
}
