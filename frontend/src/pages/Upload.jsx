import React, { useState } from "react";
import { Container, Typography, Button, Box, Paper, Alert, CircularProgress } from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!["image/jpeg", "image/png", "image/jpg"].includes(selectedFile.type)) {
        setError("Please upload a valid PNG or JPG image.");
        return;
      }
      setFile(selectedFile);
      setError("");
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/templates/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // Redirect to the placeholder configuration or gallery
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Error uploading template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          Upload Certificate Template
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box sx={{ my: 4, border: "2px dashed #ccc", p: 4, borderRadius: 2 }}>
          <input
            accept="image/png, image/jpeg"
            style={{ display: "none" }}
            id="raised-button-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="raised-button-file">
            <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />} size="large">
              Select Template Image
            </Button>
          </label>
        </Box>

        {preview && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Preview:</Typography>
            <img src={preview} alt="Template Preview" style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }} />
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!file || loading}
          sx={{ mt: 3 }}
          size="large"
        >
          {loading ? <CircularProgress size={24} /> : "Upload Template"}
        </Button>
      </Paper>
    </Container>
  );
};

export default Upload;
