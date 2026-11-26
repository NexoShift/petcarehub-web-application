import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SubscriptionApi } from '../infrastructure/subscription-api';
import { SubscriptionStore } from './subscription.store';

describe('SubscriptionStore: regreso de Stripe Checkout', () => {
  const pending = { id: 5, accountId: 3, planId: 2, isPending: true, isActive: false };
  const active = { ...pending, isPending: false, isActive: true };

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup(getSubscriptionByAccountId: ReturnType<typeof vi.fn>) {
    TestBed.configureTestingModule({
      providers: [{ provide: SubscriptionApi, useValue: { getSubscriptionByAccountId } }],
    });
    return TestBed.inject(SubscriptionStore);
  }

  it('consulta la suscripción hasta que el webhook la deja ACTIVE', () => {
    const get = vi.fn()
      .mockReturnValueOnce(of(pending))
      .mockReturnValueOnce(of(pending))
      .mockReturnValue(of(active));
    const store = setup(get);

    store.waitForActivation(3);
    expect(store.activationPending()).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(store.hasActiveSubscription()).toBe(false);
    vi.advanceTimersByTime(4000);

    expect(get).toHaveBeenCalledTimes(3);
    expect(store.hasActiveSubscription()).toBe(true);
    expect(store.activationPending()).toBe(false);
    expect(store.activationTimedOut()).toBe(false);
  });

  it('sigue intentando si una consulta falla', () => {
    const get = vi.fn()
      .mockReturnValueOnce(throwError(() => ({ status: 500 })))
      .mockReturnValue(of(active));
    const store = setup(get);

    store.waitForActivation(3);
    vi.advanceTimersByTime(3000);

    expect(store.hasActiveSubscription()).toBe(true);
  });

  it('avisa si Stripe no confirma el pago en 60 segundos', () => {
    const store = setup(vi.fn().mockReturnValue(of(pending)));

    store.waitForActivation(3);
    vi.advanceTimersByTime(61000);

    expect(store.activationTimedOut()).toBe(true);
    expect(store.activationPending()).toBe(false);
  });
});
