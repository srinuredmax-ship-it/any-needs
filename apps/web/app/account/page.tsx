"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Order = {
  id?: string;
  trackingCode: string;
  status: string;
  total: number;
  createdAt: string;
};

type Address = {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  isDefault: boolean;
};

type AddressForm = {
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  isDefault: boolean;
};

const emptyAddress: AddressForm = {
  label: "Home",
  line1: "",
  line2: "",
  city: "Vijayawada",
  state: "Andhra Pradesh",
  pincode: "",
  landmark: "",
  isDefault: false,
};

export default function AccountPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyAddress);

  const [loading, setLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);

  const [error, setError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [addressMessage, setAddressMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("anyneeds_token");

    if (!token) {
      router.push("/");
      return;
    }

    try {
      let payloadPart = token.split(".")[1];
      payloadPart = payloadPart.replace(/-/g, "+").replace(/_/g, "/");

      while (payloadPart.length % 4) {
        payloadPart += "=";
      }

      const payload = JSON.parse(atob(payloadPart));
      setPhone(payload.phone || "");
    } catch {
      setPhone("");
    }

    loadOrders();
    loadAddresses();
  }, [router]);

  async function loadOrders() {
    try {
      setError("");
      const data = await api<Order[]>("/orders/mine");
      setOrders(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAddresses() {
    try {
      setAddressError("");
      const data = await api<Address[]>("/addresses");
      setAddresses(data);
    } catch (e) {
      setAddressError((e as Error).message);
    } finally {
      setAddressLoading(false);
    }
  }

  async function addAddress() {
    try {
      setSavingAddress(true);
      setAddressError("");
      setAddressMessage("");

      await api<Address>("/addresses", {
        method: "POST",
        body: JSON.stringify({
          label: form.label,
          line1: form.line1,
          line2: form.line2 || undefined,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          landmark: form.landmark || undefined,
          isDefault: form.isDefault,
        }),
      });

      setForm(emptyAddress);
      setAddressMessage("Address saved successfully.");
      await loadAddresses();
    } catch (e) {
      setAddressError((e as Error).message);
    } finally {
      setSavingAddress(false);
    }
  }

  async function deleteAddress(id: string) {
    if (!confirm("Delete this saved address?")) return;

    try {
      setAddressError("");
      setAddressMessage("");

      await api(`/addresses/${id}`, {
        method: "DELETE",
      });

      setAddressMessage("Address deleted.");
      await loadAddresses();
    } catch (e) {
      setAddressError((e as Error).message);
    }
  }

  function logout() {
    localStorage.removeItem("anyneeds_token");
    router.push("/");
  }

  return (
    <main>
      <header className="topbar">
        <Link className="brand" href="/">
          <img src="/any-needs-logo.jpg" alt="Any Needs" />
          <span>
            <b>ANY NEEDS</b>
            <small>One Cart. Every Need.</small>
          </span>
        </Link>

        <nav>
          <Link href="/">Store</Link>
          <Link href="/orders">Track order</Link>
          <button onClick={logout}>Logout</button>
        </nav>
      </header>

      <section className="tracking">
        <span className="eyebrow dark">MY ACCOUNT</span>
        <h1>Welcome to Any Needs</h1>
        <p>Manage your account, addresses and orders.</p>

        <section className="panel" style={{ marginTop: 24 }}>
          <h2>Profile</h2>
          <p>
            <b>Mobile number:</b> {phone || "Logged-in customer"}
          </p>
        </section>

        <section className="panel" style={{ marginTop: 24 }}>
          <h2>Saved addresses</h2>

          {addressLoading && <p>Loading addresses...</p>}

          {addressError && <p className="error">{addressError}</p>}

          {addressMessage && <p className="alert">{addressMessage}</p>}

          {!addressLoading && addresses.length === 0 && (
            <p>No saved addresses yet.</p>
          )}

          {!addressLoading &&
            addresses.map((address) => (
              <div
                key={address.id}
                className="orderTotal"
                style={{
                  marginTop: 16,
                  alignItems: "flex-start",
                }}
              >
                <span>
                  <b>
                    {address.label}
                    {address.isDefault ? " • Default" : ""}
                  </b>
                  <br />

                  <small>
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                  </small>
                  <br />

                  <small>
                    {address.city}, {address.state} - {address.pincode}
                  </small>

                  {address.landmark && (
                    <>
                      <br />
                      <small>Landmark: {address.landmark}</small>
                    </>
                  )}
                </span>

                <button onClick={() => deleteAddress(address.id)}>
                  Delete
                </button>
              </div>
            ))}

          <div style={{ marginTop: 28 }}>
            <h3>Add new address</h3>

            <div className="formGrid">
              <label>
                Label
                <select
                  value={form.label}
                  onChange={(e) =>
                    setForm({ ...form, label: e.target.value })
                  }
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="full">
                Address
                <input
                  value={form.line1}
                  onChange={(e) =>
                    setForm({ ...form, line1: e.target.value })
                  }
                  placeholder="House / flat, street"
                />
              </label>

              <label className="full">
                Area / Locality
                <input
                  value={form.line2}
                  onChange={(e) =>
                    setForm({ ...form, line2: e.target.value })
                  }
                  placeholder="Area or locality"
                />
              </label>

              <label>
                City
                <input
                  value={form.city}
                  onChange={(e) =>
                    setForm({ ...form, city: e.target.value })
                  }
                />
              </label>

              <label>
                State
                <input
                  value={form.state}
                  onChange={(e) =>
                    setForm({ ...form, state: e.target.value })
                  }
                />
              </label>

              <label>
                PIN code
                <input
                  value={form.pincode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pincode: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6),
                    })
                  }
                  placeholder="6-digit PIN"
                />
              </label>

              <label>
                Landmark
                <input
                  value={form.landmark}
                  onChange={(e) =>
                    setForm({ ...form, landmark: e.target.value })
                  }
                  placeholder="Optional"
                />
              </label>

              <label className="full">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isDefault: e.target.checked,
                    })
                  }
                />{" "}
                Make this my default address
              </label>
            </div>

            <button
              className="primary"
              onClick={addAddress}
              disabled={
                savingAddress ||
                !form.line1.trim() ||
                !form.city.trim() ||
                !form.state.trim() ||
                form.pincode.length !== 6
              }
            >
              {savingAddress ? "Saving..." : "Save address"}
            </button>
          </div>
        </section>

        <section className="panel" style={{ marginTop: 24 }}>
          <h2>My orders</h2>

          {loading && <p>Loading your orders...</p>}

          {error && <p className="error">{error}</p>}

          {!loading && !error && orders.length === 0 && (
            <p>You have not placed any orders yet.</p>
          )}

          {!loading &&
            orders.map((order) => (
              <div
                key={order.trackingCode}
                className="orderTotal"
                style={{ marginTop: 16 }}
              >
                <span>
                  <b>{order.trackingCode}</b>
                  <br />

                  <small>
                    {new Date(order.createdAt).toLocaleString("en-IN")}
                  </small>
                  <br />

                  <small>Status: {order.status}</small>
                </span>

                <span>
                  <b>₹{order.total}</b>
                  <br />
                  <Link href={`/orders?code=${order.trackingCode}`}>
                    Track
                  </Link>
                </span>
              </div>
            ))}
        </section>

        <p style={{ marginTop: 24 }}>
          <Link href="/">← Continue shopping</Link>
        </p>
      </section>
    </main>
  );
}