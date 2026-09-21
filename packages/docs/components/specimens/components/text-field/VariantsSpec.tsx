import { useState } from "react";
import { TextField } from "@dreamlake/uikit";

export const VariantsSpec = () => {
  const [slug, setSlug] = useState("acme-robotics");
  const [taken, setTaken] = useState("dreamlake");
  const [bio, setBio] = useState("");
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        maxWidth: 360,
      }}
    >
      {/* checked and free — green rule, ✓ note */}
      <TextField
        value={slug}
        onChange={setSlug}
        prefix="/"
        mono
        valid
        note="available"
      />
      {/* checked and taken — red rule, × note */}
      <TextField
        value={taken}
        onChange={setTaken}
        prefix="/"
        mono
        invalid
        note="already taken"
      />
      {/* neutral helper */}
      <TextField
        value=""
        onChange={() => {}}
        placeholder="acme-robotics"
        prefix="/"
        mono
        note="lowercase, digits and dashes"
      />
      {/* multiline → textarea */}
      <TextField
        value={bio}
        onChange={setBio}
        multiline
        rows={3}
        placeholder="Description…"
      />
    </div>
  );
};
