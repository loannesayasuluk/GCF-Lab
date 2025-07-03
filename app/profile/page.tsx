"use client";
import { useAuthUser } from "@/components/AuthUserProvider";
import { useState } from "react";
import { updateProfile } from "firebase/auth";

export default function ProfilePage() {
  const { user } = useAuthUser();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!user) return <div className="p-8">로그인이 필요합니다.</div>;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateProfile(user, { displayName: name });
      setEditing(false);
    } catch (e) {
      setError("수정에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">내 정보</h2>
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <span className="font-semibold">이름/닉네임:</span>{" "}
          {editing ? (
            <>
              <input
                className="border rounded px-2 py-1 text-base mr-2"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={saving}
                maxLength={30}
              />
              <button
                className="bg-emerald-500 text-white px-3 py-1 rounded mr-2 disabled:opacity-50"
                onClick={handleSave}
                disabled={saving || !name.trim()}
              >저장</button>
              <button
                className="bg-gray-200 px-3 py-1 rounded"
                onClick={() => { setEditing(false); setName(user.displayName || ""); }}
                disabled={saving}
              >취소</button>
            </>
          ) : (
            <>
              {user.displayName || "-"}
              <button
                className="ml-3 text-emerald-600 underline text-sm"
                onClick={() => setEditing(true)}
              >수정</button>
            </>
          )}
        </div>
        <div><span className="font-semibold">이메일:</span> {user.email}</div>
        {user.metadata?.creationTime && (
          <div><span className="font-semibold">가입일:</span> {new Date(user.metadata.creationTime).toLocaleDateString()}</div>
        )}
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </div>
    </div>
  );
} 