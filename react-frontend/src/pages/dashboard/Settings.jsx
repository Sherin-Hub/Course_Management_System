import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { isPhone, passwordStrength } from "../../lib/validate";
import { resetPassword } from "../../lib/storage";

function initialsOf(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [profileErr, setProfileErr] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const strength = passwordStrength(newPw);

  async function handleProfileSave(e) {
    e.preventDefault();
    if (!name.trim()) return setProfileErr("Name can't be empty.");
    if (!isPhone(phone)) return setProfileErr("Enter a valid 10-digit mobile number.");
    setProfileErr("");
    try {
      setSavingProfile(true);
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      showToast("Profile updated", "success");
    } catch {
      setProfileErr("Could not update your profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    if (currentPw !== user.password) return setPwErr("Current password is incorrect.");
    if (newPw.length < 8) return setPwErr("New password must be at least 8 characters.");
    if (newPw !== confirmPw) return setPwErr("Passwords don't match.");
    setPwErr("");
    try {
      setSavingPassword(true);
      await resetPassword(user.email, newPw);
      await updateProfile({ password: newPw });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      showToast("Password changed", "success");
    } catch {
      setPwErr("Could not change your password. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <>
      <div className="dash-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your profile and account security.</p>
        </div>
      </div>

      <div className="dash-block settings-block">
        <div className="dash-block-head"><h2>Profile</h2></div>
        <div className="settings-profile-head">
          <div className="dash-avatar lg">{initialsOf(name || user.name)}</div>
          <div>
            <div className="dash-user-name">{user.name}</div>
            <span className="badge badge-role">{user.role}</span>
          </div>
        </div>

        <form onSubmit={handleProfileSave} noValidate>
          <div className="field-row">
            <div className="field">
              <label htmlFor="setName">Full name</label>
              <input id="setName" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="setPhone">Mobile number</label>
              <input id="setPhone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Email address</label>
            <input value={user.email} disabled />
          </div>
          {profileErr && <p className="err-msg visible">{profileErr}</p>}
          <button type="submit" className="form-btn form-btn-inline" disabled={savingProfile}>
            {savingProfile ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>

      <div className="dash-block settings-block">
        <div className="dash-block-head"><h2>Change password</h2></div>
        <form onSubmit={handlePasswordSave} noValidate>
          <div className="field">
            <label htmlFor="curPw">Current password</label>
            <input id="curPw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="newPw">New password</label>
            <input id="newPw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            <div className="pw-strength">
              <div className="pw-strength-bar">
                <div className="pw-strength-fill" style={{ width: `${strength.pct}%`, background: strength.color }} />
              </div>
              <span className="pw-strength-label">{strength.label}</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="confirmPw">Confirm new password</label>
            <input id="confirmPw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </div>
          {pwErr && <p className="err-msg visible">{pwErr}</p>}
          <button type="submit" className="form-btn form-btn-inline" disabled={savingPassword}>
            {savingPassword ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </>
  );
}
