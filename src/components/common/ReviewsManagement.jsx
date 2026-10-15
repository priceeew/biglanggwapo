import React, { useState } from 'react';
import {
  Star, Check, Layers, Eye, EyeOff, Plus, Trash2, X, AlertTriangle,
  Upload, Image as ImageIcon, Scissors, User, MessageSquare
} from 'lucide-react';
import { useStore, currency, humanDate, stars, today } from '../../context/StoreContext';
import { saveReviewToAtlas, deleteReviewFromAtlas, uploadImageFile } from '../../services/api';
import {
  BentoStats, SectionCard, Toolbar, DataTable, StatusBadge, EmptyState
} from './UIComponents';

export function ReviewsManagement({ role = 'admin', barberFilter = null }) {
  const { demo, commit, notify } = useStore();
  const [query, setQuery] = useState('');
  const [filterRating, setFilterRating] = useState('All');
  const [filterVisibility, setFilterVisibility] = useState('All');
  const [viewScope, setViewScope] = useState(barberFilter ? 'mine' : 'all'); // 'mine' or 'all'

  // Modal states
  const [isAdding, setIsAdding] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);

  // Add review form state & validation errors
  const [formCustomer, setFormCustomer] = useState('');
  const [formBarberId, setFormBarberId] = useState(barberFilter?.id || demo.barbers?.[0]?.id || '');
  const [formServiceId, setFormServiceId] = useState(demo.services?.[0]?.id || '');
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [formDate, setFormDate] = useState(today);
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [formImage, setFormImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const allReviews = demo.reviews || [];

  // Match reviews to the specific barber if needed
  const matchesBarberRecord = (r, b) => {
    if (!r || !b) return false;
    if (b.id && (r.barberId === b.id || r.barber === b.name)) return true;
    if (b.name && r.barber && r.barber.toLowerCase() === b.name.toLowerCase()) return true;
    return false;
  };

  const scopedReviews = (role === 'barber' && viewScope === 'mine' && barberFilter)
    ? allReviews.filter((r) => matchesBarberRecord(r, barberFilter))
    : allReviews;

  const isHidden = (r) => Boolean(r.hidden || r.public === false);

  const avgRating = scopedReviews.length > 0
    ? (scopedReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / scopedReviews.length).toFixed(1)
    : '0.0';

  const fiveStarsCount = scopedReviews.filter((r) => Number(r.rating) >= 5).length;
  const publicCount = scopedReviews.filter((r) => !isHidden(r)).length;
  const hiddenCount = scopedReviews.filter((r) => isHidden(r)).length;

  const filtered = scopedReviews.filter((r) => {
    const q = query.trim().toLowerCase();
    const matchQuery = !q || `${r.customer || ''} ${r.barber || ''} ${r.service || ''} ${r.comment || ''}`.toLowerCase().includes(q);
    const matchRating = filterRating === 'All' ? true : Math.round(Number(r.rating)) === Number(filterRating);
    const matchVisibility = filterVisibility === 'All'
      ? true
      : filterVisibility === 'Public'
        ? !isHidden(r)
        : isHidden(r);
    return matchQuery && matchRating && matchVisibility;
  });

  // Toggle Hide / Unhide action
  const handleToggleHide = async (review) => {
    const willHide = !isHidden(review);
    const updatedReview = {
      ...review,
      hidden: willHide,
      public: !willHide
    };

    // Immediate optimistic update
    commit((state) => ({
      ...state,
      reviews: (state.reviews || []).map((r) => r.id === review.id ? updatedReview : r)
    }));

    // Synchronize to MongoDB Atlas
    const res = await saveReviewToAtlas(updatedReview).catch((err) => {
      console.error('Failed to sync hide status to Atlas:', err);
      return { success: false };
    });

    if (res && res.success === false) {
      notify('Failed to update review visibility in database.', 'error');
    } else {
      notify(
        `Review by ${review.customer || 'client'} is now ${willHide ? 'HIDDEN from public testimonials' : 'PUBLIC on testimonials carousel'}.`,
        willHide ? 'warning' : 'success'
      );
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (review) => {
    setReviewToDelete(review);
  };

  // Execute delete after validation/confirmation
  const handleConfirmDelete = async () => {
    if (!reviewToDelete || !reviewToDelete.id) return;
    const targetId = reviewToDelete.id;
    const targetName = reviewToDelete.customer || 'Client';

    // Commit deletion to store
    commit((state) => ({
      ...state,
      reviews: (state.reviews || []).filter((r) => r.id !== targetId)
    }));

    // Delete in Atlas database
    await deleteReviewFromAtlas(targetId).catch((err) => {
      console.error('Failed to delete review from Atlas:', err);
    });

    notify(`Review by ${targetName} permanently deleted from database.`, 'success');
    setReviewToDelete(null);
  };

  // Validate and submit Add Review form
  const handleOpenAddModal = () => {
    setFormCustomer('');
    setFormBarberId(barberFilter?.id || demo.barbers?.[0]?.id || '');
    setFormServiceId(demo.services?.[0]?.id || '');
    setFormRating(5);
    setFormComment('');
    setFormDate(today);
    setFormIsPublic(true);
    setFormImage('');
    setFormErrors({});
    setIsAdding(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formCustomer.trim() || formCustomer.trim().length < 2) {
      errors.customer = 'Customer name must be at least 2 characters.';
    }
    if (!formBarberId) {
      errors.barber = 'Please select a barber.';
    }
    if (!formServiceId) {
      errors.service = 'Please select a service.';
    }
    if (!formRating || formRating < 1 || formRating > 5) {
      errors.rating = 'Please provide a star rating between 1 and 5.';
    }
    if (!formComment.trim() || formComment.trim().length < 5) {
      errors.comment = 'Feedback must be at least 5 characters.';
    }
    if (!formDate) {
      errors.date = 'Review date is required.';
    }
    return errors;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const result = await uploadImageFile(file);
    setIsUploading(false);
    if (result.success && result.url) {
      setFormImage(result.url);
      notify('Photo uploaded successfully.');
    } else {
      notify(result.error || 'Failed to upload photo.', 'error');
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      notify('Please resolve the errors highlighted in red.', 'error');
      return;
    }

    const selectedBarber = (demo.barbers || []).find((b) => b.id === formBarberId);
    const selectedService = (demo.services || []).find((s) => s.id === formServiceId);

    const newReview = {
      id: `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      customer: formCustomer.trim(),
      initials: formCustomer.trim().split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'CU',
      customerId: '',
      barber: selectedBarber?.name || 'Shop Barber',
      barberId: selectedBarber?.id || formBarberId,
      service: selectedService?.name || 'Haircut Service',
      serviceName: selectedService?.name || 'Haircut Service',
      rating: Number(formRating),
      comment: formComment.trim(),
      date: formDate,
      image: formImage || undefined,
      public: Boolean(formIsPublic),
      hidden: !Boolean(formIsPublic),
      createdAt: new Date()
    };

    // Optimistic commit
    commit((state) => ({
      ...state,
      reviews: [newReview, ...(state.reviews || [])]
    }));

    // Save to MongoDB Atlas
    await saveReviewToAtlas(newReview).catch((err) => {
      console.error('Failed saving new review to Atlas:', err);
    });

    notify(`Review by ${newReview.customer} added successfully!`, 'success');
    setIsAdding(false);
  };

  return (
    <>
      <BentoStats
        items={[
          [
            role === 'barber' && viewScope === 'mine' ? 'My Reviews' : 'Total Reviews',
            `${scopedReviews.length} verified`,
            Star,
            role === 'barber' && viewScope === 'mine' ? `Direct cuts with ${barberFilter?.name || 'you'}` : 'Customer submissions'
          ],
          [
            'Average Rating',
            scopedReviews.length > 0 ? `${avgRating} / 5.0` : 'No reviews',
            Star,
            scopedReviews.length > 0 ? stars(Number(avgRating)) : '☆☆☆☆☆'
          ],
          [
            '5-Star Ratings',
            `${fiveStarsCount} perfect cuts`,
            Check,
            scopedReviews.length > 0 ? `${Math.round((fiveStarsCount / scopedReviews.length) * 100)}% satisfaction` : 'Awaiting feedback'
          ],
          [
            'Public vs Hidden',
            `${publicCount} public · ${hiddenCount} hidden`,
            Layers,
            'Control public homepage carousel display'
          ]
        ]}
      />

      <Toolbar
        title={role === 'barber' && viewScope === 'mine' ? `Customer Reviews for ${barberFilter?.name || 'Barber'}` : 'Customer Reviews & Feedback'}
        count={filtered.length}
        query={query}
        setQuery={setQuery}
        description="Monitor verified client satisfaction ratings, toggle public visibility with the Hide button, and manage feedback entries."
        action={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {role === 'barber' && barberFilter && (
              <div style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: '6px', overflow: 'hidden' }}>
                <button
                  type="button"
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: 'none',
                    background: viewScope === 'mine' ? 'var(--ink)' : 'var(--white)',
                    color: viewScope === 'mine' ? '#fff' : 'var(--muted)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setViewScope('mine')}
                >
                  My Reviews
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: 'none',
                    background: viewScope === 'all' ? 'var(--ink)' : 'var(--white)',
                    color: viewScope === 'all' ? '#fff' : 'var(--muted)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setViewScope('all')}
                >
                  All Shop
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Rating:</span>
              <select
                className="input"
                style={{ width: '110px', padding: '6px 8px', fontSize: '12px' }}
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
              >
                <option value="All">All Stars</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Status:</span>
              <select
                className="input"
                style={{ width: '120px', padding: '6px 8px', fontSize: '12px' }}
                value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Public">Public Only</option>
                <option value="Hidden">Hidden Only</option>
              </select>
            </div>

            <button
              type="button"
              className="button button-dark button-small"
              onClick={handleOpenAddModal}
            >
              <Plus size={14} /> Add Review
            </button>
          </div>
        }
      />

      <SectionCard>
        <DataTable columns={['Client & Date', 'Barber & Service', 'Rating', 'Visibility', 'Review & Feedback', 'Actions']}>
          <tbody>
            {filtered.map((r) => {
              const hidden = isHidden(r);
              return (
                <tr key={r.id}>
                  <td>
                    <div className="table-person">
                      <span className="avatar avatar-xs">{(r.customer || 'CU').slice(0, 2).toUpperCase()}</span>
                      <div>
                        <strong>{r.customer || 'Anonymous Client'}</strong>
                        <small className="table-sub">{humanDate(r.date)}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{r.barber || 'On-Duty Barber'}</strong>
                    <small className="table-sub">{r.service || r.serviceName || 'Haircut Service'}</small>
                  </td>
                  <td>
                    <span style={{ color: 'var(--gold)', letterSpacing: '1px' }}>{stars(r.rating || 5)}</span>
                    <small className="table-sub">{Number(r.rating || 5).toFixed(1)} / 5.0</small>
                  </td>
                  <td>
                    <StatusBadge status={hidden ? 'Hidden' : 'Public'} />
                  </td>
                  <td style={{ maxWidth: '320px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--charcoal)', lineHeight: '1.4' }}>
                      {r.comment ? `“${r.comment}”` : 'No written feedback provided.'}
                    </p>
                    {r.image && (
                      <img
                        src={r.image}
                        alt="Review attachment"
                        style={{
                          width: '42px',
                          height: '42px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          marginTop: '6px',
                          border: '1px solid var(--line)',
                          cursor: 'pointer'
                        }}
                        onClick={() => setActivePhoto(r.image)}
                        title="Click to zoom photo"
                      />
                    )}
                  </td>
                  <td>
                    <div className="row-actions" style={{ gap: '6px' }}>
                      <button
                        type="button"
                        className={`button button-small ${hidden ? 'button-soft' : 'button-ghost'}`}
                        style={{
                          padding: '6px 10px',
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        onClick={() => handleToggleHide(r)}
                        title={hidden ? 'Unhide review to display on public testimonials' : 'Hide review from public testimonials'}
                      >
                        {hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                        <span>{hidden ? 'Unhide' : 'Hide'}</span>
                      </button>

                      <button
                        type="button"
                        className="button button-ghost button-small danger-text"
                        style={{
                          padding: '6px 10px',
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        onClick={() => openDeleteModal(r)}
                        title="Delete review from database"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
        {!filtered.length && (
          <EmptyState
            icon={Star}
            title="No reviews match your filters"
            copy="Try adjusting your search query, rating filter, or visibility state."
          />
        )}
      </SectionCard>

      {/* Delete Confirmation Modal */}
      {reviewToDelete && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setReviewToDelete(null)}>
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <button className="modal-close" onClick={() => setReviewToDelete(null)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="modal-heading">
              <div className="modal-mark" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                <AlertTriangle size={22} />
              </div>
              <span className="eyebrow" style={{ color: '#b91c1c' }}>Confirm Permanent Deletion</span>
              <h2>Delete Review?</h2>
              <p>This action cannot be undone. The review record will be permanently deleted from MongoDB Atlas.</p>
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', padding: '14px', borderRadius: '8px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong>{reviewToDelete.customer || 'Anonymous'}</strong>
                <span style={{ color: 'var(--gold)' }}>{stars(reviewToDelete.rating || 5)}</span>
              </div>
              <small style={{ color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                Barber: {reviewToDelete.barber} · Service: {reviewToDelete.service || reviewToDelete.serviceName}
              </small>
              <p style={{ margin: 0, fontSize: '12px', fontStyle: 'italic', color: 'var(--charcoal)' }}>
                “{reviewToDelete.comment || 'No text feedback.'}”
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="button button-ghost button-full"
                onClick={() => setReviewToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-danger button-full"
                onClick={handleConfirmDelete}
              >
                <Trash2 size={15} /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Review Modal */}
      {isAdding && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setIsAdding(false)}>
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <button className="modal-close" onClick={() => setIsAdding(false)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <div className="modal-heading">
              <div className="modal-mark"><Star size={20} /></div>
              <span className="eyebrow gold">Customer Feedback Portal</span>
              <h2>Add Customer Review</h2>
              <p>Record client feedback or onsite physical comment cards directly into the verified review database.</p>
            </div>

            <form className="form-stack" onSubmit={handleSubmitAdd}>
              <div>
                <label className="field-label">Customer Name *
                  <input
                    className="input"
                    placeholder="e.g. Miguel Santos"
                    value={formCustomer}
                    onChange={(e) => {
                      setFormCustomer(e.target.value);
                      if (formErrors.customer) setFormErrors({ ...formErrors, customer: null });
                    }}
                    style={{ borderColor: formErrors.customer ? '#b91c1c' : undefined }}
                  />
                </label>
                {formErrors.customer && (
                  <small style={{ color: '#b91c1c', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                    {formErrors.customer}
                  </small>
                )}
              </div>

              <div className="form-grid">
                <div>
                  <label className="field-label">Barber *
                    <select
                      className="input"
                      value={formBarberId}
                      onChange={(e) => {
                        setFormBarberId(e.target.value);
                        if (formErrors.barber) setFormErrors({ ...formErrors, barber: null });
                      }}
                      style={{ borderColor: formErrors.barber ? '#b91c1c' : undefined }}
                    >
                      {(demo.barbers || []).map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </label>
                  {formErrors.barber && (
                    <small style={{ color: '#b91c1c', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                      {formErrors.barber}
                    </small>
                  )}
                </div>

                <div>
                  <label className="field-label">Service Received *
                    <select
                      className="input"
                      value={formServiceId}
                      onChange={(e) => {
                        setFormServiceId(e.target.value);
                        if (formErrors.service) setFormErrors({ ...formErrors, service: null });
                      }}
                      style={{ borderColor: formErrors.service ? '#b91c1c' : undefined }}
                    >
                      {(demo.services || []).map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({currency(s.price)})</option>
                      ))}
                    </select>
                  </label>
                  {formErrors.service && (
                    <small style={{ color: '#b91c1c', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                      {formErrors.service}
                    </small>
                  )}
                </div>
              </div>

              <div>
                <label className="field-label">Rating *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => {
                          setFormRating(starVal);
                          if (formErrors.rating) setFormErrors({ ...formErrors, rating: null });
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          color: starVal <= formRating ? 'var(--gold)' : '#d1d5db',
                          fontSize: '22px'
                        }}
                        title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                    {formRating === 5 ? '5.0 - Master cut / Excellent' :
                     formRating === 4 ? '4.0 - Great service' :
                     formRating === 3 ? '3.0 - Satisfactory' :
                     formRating === 2 ? '2.0 - Needs improvement' : '1.0 - Poor'}
                  </span>
                </div>
                {formErrors.rating && (
                  <small style={{ color: '#b91c1c', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                    {formErrors.rating}
                  </small>
                )}
              </div>

              <div>
                <label className="field-label">Feedback / Review *
                  <textarea
                    className="input textarea"
                    placeholder="Describe the client experience, styling quality, atmosphere, etc. (min 5 characters)"
                    value={formComment}
                    onChange={(e) => {
                      setFormComment(e.target.value);
                      if (formErrors.comment) setFormErrors({ ...formErrors, comment: null });
                    }}
                    style={{ minHeight: '80px', borderColor: formErrors.comment ? '#b91c1c' : undefined }}
                  />
                </label>
                {formErrors.comment && (
                  <small style={{ color: '#b91c1c', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                    {formErrors.comment}
                  </small>
                )}
              </div>

              <div className="form-grid">
                <div>
                  <label className="field-label">Date
                    <input
                      className="input"
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </label>
                </div>
                <div>
                  <label className="field-label">Public Status
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px' }}>
                      <input
                        type="checkbox"
                        id="reviewIsPublic"
                        checked={formIsPublic}
                        onChange={(e) => setFormIsPublic(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="reviewIsPublic" style={{ fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                        {formIsPublic ? 'Visible on Website' : 'Hidden from Website'}
                      </label>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="field-label">Photo Attachment (Optional)
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleImageUpload}
                    style={{ marginTop: '4px', fontSize: '12px' }}
                  />
                </label>
                {isUploading && (
                  <small style={{ color: 'var(--gold)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                    Uploading image...
                  </small>
                )}
                {formImage && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src={formImage}
                      alt="Uploaded cut"
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--line)' }}
                    />
                    <button
                      type="button"
                      style={{ fontSize: '11px', color: '#b91c1c', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => setFormImage('')}
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="button button-ghost button-full"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-dark button-full"
                >
                  <Plus size={16} /> Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {activePhoto && (
        <div className="modal-backdrop" onMouseDown={() => setActivePhoto(null)}>
          <div className="modal-card" style={{ maxWidth: '560px', padding: '16px', textAlign: 'center' }}>
            <button className="modal-close" onClick={() => setActivePhoto(null)} aria-label="Close photo">
              <X size={18} />
            </button>
            <img
              src={activePhoto}
              alt="Enlarged review cut"
              style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
