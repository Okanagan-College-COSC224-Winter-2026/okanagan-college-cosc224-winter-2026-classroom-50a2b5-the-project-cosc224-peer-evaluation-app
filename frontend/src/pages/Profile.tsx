import { useEffect, useState, ChangeEvent } from "react";
import "./Profile.css";
import { getMyProfile, updateMyProfile } from "../util/api";

type ProfileData = {
  id: number;
  name?: string;
  email?: string;
  profile_picture?: string | null;
};

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fullName, setFullName] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getMyProfile();
        setProfile(data);
        setFullName(data.name || "");

        const existingRaw = localStorage.getItem("user");
        if (existingRaw) {
          try {
            const existing = JSON.parse(existingRaw);
            const updatedLocal = {
              ...existing,
              name: data.name,
              email: data.email,
              profile_picture: data.profile_picture,
              user: existing.user
                ? {
                    ...existing.user,
                    name: data.name,
                    email: data.email,
                    profile_picture: data.profile_picture,
                  }
                : undefined,
            };
            localStorage.setItem(
              "user",
              JSON.stringify(updatedLocal)
            );
          } catch {
            //
          }
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        setMessage("Failed to load profile");
      }
    };

    loadProfile();
  }, []);

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    setSelectedImage(file);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage("");
  };

  const handleCancel = () => {
    if (!profile) return;
    setFullName(profile.name || "");
    setSelectedImage(null);
    setIsEditing(false);
    setMessage("");
  };

  const handleSave = async () => {
    try {
      setMessage("");

      const result = await updateMyProfile(
        fullName,
        selectedImage
      );

      const updated = result.user;
      setProfile(updated);
      setFullName(updated.name || "");
      setSelectedImage(null);
      setIsEditing(false);

      const existingRaw = localStorage.getItem("user");
      if (existingRaw) {
        try {
          const existing = JSON.parse(existingRaw);
          const updatedLocal = {
            ...existing,
            name: updated.name,
            email: updated.email,
            profile_picture: updated.profile_picture,
            user: existing.user
              ? {
                  ...existing.user,
                  name: updated.name,
                  email: updated.email,
                  profile_picture: updated.profile_picture,
                }
              : undefined,
          };
          localStorage.setItem(
            "user",
            JSON.stringify(updatedLocal)
          );
        } catch {
          //
        }
      }

      setMessage("Profile updated.");
    } catch (error) {
      console.error(error);
      setMessage("Failed to update profile");
    }
  };

  const profileImageSrc = selectedImage
    ? URL.createObjectURL(selectedImage)
    : profile?.profile_picture
    ? `http://localhost:5000/user/${profile.profile_picture}`
    : "https://placehold.co/200x200";

  return (
    <div className="Profile">
      <div className="profile-image">
        <img src={profileImageSrc} alt="profile" />
      </div>

      <div className="profile-info">
        {!isEditing ? (
          <>
            <h1>Name</h1>
            <span>{profile?.name || "No name found"}</span>

            <h1>Email</h1>
            <span>{profile?.email || "No email found"}</span>

            <button onClick={handleEdit}>Edit Profile</button>
          </>
        ) : (
          <>
            <h1>Name</h1>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <h1>Email</h1>
            <span>{profile?.email || "No email found"}</span>

            <h1>Profile Picture</h1>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={handleImageChange}
            />

            {selectedImage && <span>{selectedImage.name}</span>}

            <div className="profile-buttons">
              <button onClick={handleSave}>Save</button>
              <button onClick={handleCancel}>Cancel</button>
            </div>
          </>
        )}

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}