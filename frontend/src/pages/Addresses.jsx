import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import addressApi from '../api/addressApi.js';
import AddressForm from '../components/AddressForm.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Loader from '../components/Loader.jsx';
import { getApiError } from '../utils/apiError.js';

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingAddress, setEditingAddress] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingAddressId, setPendingAddressId] = useState(null);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await addressApi.getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      setLoadError(getApiError(error, 'Could not load your saved addresses.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const startAdd = () => {
    setEditingAddress(null);
    setFormOpen(true);
  };

  const startEdit = (address) => {
    setEditingAddress(address);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingAddress(null);
  };

  const saveAddress = async (details) => {
    if (editingAddress) {
      await addressApi.updateAddress(editingAddress.id, details);
      toast.success('Address updated.');
    } else {
      await addressApi.createAddress(details);
      toast.success('Address added.');
    }
    closeForm();
    await loadAddresses();
  };

  const handleDelete = async (address) => {
    if (!window.confirm(`Delete the address for ${address.fullName}?`)) return;
    setPendingAddressId(address.id);
    try {
      await addressApi.deleteAddress(address.id);
      toast.success('Address deleted.');
      await loadAddresses();
    } catch (error) {
      toast.error(getApiError(error, 'Could not delete this address.').message);
    } finally {
      setPendingAddressId(null);
    }
  };

  const handleSetDefault = async (address) => {
    setPendingAddressId(address.id);
    try {
      await addressApi.setDefaultAddress(address.id);
      toast.success('Default address updated.');
      await loadAddresses();
    } catch (error) {
      toast.error(getApiError(error, 'Could not update the default address.').message);
    } finally {
      setPendingAddressId(null);
    }
  };

  return (
    <section className="container addresses-page py-4 py-lg-5">
      <div className="addresses-heading">
        <div>
          <span className="section-eyebrow">Delivery details</span>
          <h1>Your addresses</h1>
          <p>Save the places where you would like your orders delivered.</p>
        </div>
        {!formOpen && <button className="btn btn-primary" type="button" onClick={startAdd}>Add address</button>}
      </div>

      {formOpen && (
        <AddressForm
          key={editingAddress?.id || 'new-address'}
          initialAddress={editingAddress}
          title={editingAddress ? 'Edit address' : 'Add an address'}
          submitLabel={editingAddress ? 'Save changes' : 'Save address'}
          onSubmit={saveAddress}
          onCancel={closeForm}
        />
      )}

      {loading && addresses.length === 0 && <Loader label="Loading your addresses..." />}
      {loadError && <div className="my-4"><ErrorMessage message={loadError} onRetry={loadAddresses} /></div>}

      {!loading && !loadError && addresses.length === 0 && !formOpen && (
        <div className="addresses-empty-state">
          <span className="empty-basket" aria-hidden="true">+</span>
          <h2>No saved addresses</h2>
          <p>Add your first delivery address to make future orders easier.</p>
          <button className="btn btn-primary" type="button" onClick={startAdd}>Add your first address</button>
        </div>
      )}

      {addresses.length > 0 && (
        <div className="row g-3 address-grid">
          {addresses.map((address) => {
            const pending = pendingAddressId === address.id;
            return (
              <div className="col-12 col-md-6 col-xl-4" key={address.id}>
                <article className="address-card h-100">
                  <div className="address-card-heading">
                    <h2>{address.fullName}</h2>
                    {address.defaultAddress && <span className="address-default-badge">Default</span>}
                  </div>
                  <p className="address-phone">{address.phone}</p>
                  <address>
                    {address.line1}{address.line2 && <><br />{address.line2}</>}<br />
                    {address.city}, {address.state} {address.pincode}
                  </address>
                  <div className="address-card-actions">
                    <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => startEdit(address)} disabled={pending}>Edit</button>
                    {!address.defaultAddress && <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => handleSetDefault(address)} disabled={pending}>Set as default</button>}
                    <button className="btn btn-sm btn-link text-danger" type="button" onClick={() => handleDelete(address)} disabled={pending}>Delete</button>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
