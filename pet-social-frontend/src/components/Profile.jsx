import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "./card";

export default function Profile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    axios
      .get("/api/profile/me/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      })
      .then((res) => setProfile(res.data));
  }, []);

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-[#baa6ba] flex items-center justify-center">
      <Card className="mx-auto mt-10 p-4 shadow-xl rounded-2xl">
        <CardContent>
          <div className="flex items-center gap-4">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="avatar"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-green-100 rounded-full" />
            )}
            <div>
              <h2 className="text-xl font-bold text-green-700">{profile.username}</h2>
              <p className="text-sm text-green-600">{profile.email}</p>
            </div>
          </div>
          <p className="mt-4 text-green-700">{profile.bio}</p>
          <p className="text-sm text-green-500">Город: {profile.city || "—"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
