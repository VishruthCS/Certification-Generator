import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Typography, Box, Paper, TextField, Button, CircularProgress, Alert, Grid } from "@mui/material";
import { Stage, Layer, Image as KonvaImage, Text } from "react-konva";
import useImage from "use-image";
import api from "../services/api";

const TemplateImage = ({ imageUrl, onImageLoaded }) => {
  const [image] = useImage(imageUrl);
  
  useEffect(() => {
    if (image && onImageLoaded) {
      onImageLoaded(image.width, image.height);
    }
  }, [image]);

  return image ? <KonvaImage image={image} /> : null;
};

const Generate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  
  // Image scaling state for preview
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  // Using 600 width for the right panel preview
  const scale = Math.min(600 / imageSize.width, 400 / imageSize.height);
  
  // Form state
  const [formData, setFormData] = useState({});
  const [fields, setFields] = useState([]);
  
  const textRefs = React.useRef({});

  useEffect(() => {
    // Keep text perfectly centered around the X coordinate as user types
    Object.keys(textRefs.current).forEach(key => {
      const node = textRefs.current[key];
      if (node) {
        node.offsetX(node.width() / 2);
      }
    });
  }, [formData, fields]);

  useEffect(() => {
    fetchTemplateAndFields();
  }, [id]);

  const fetchTemplateAndFields = async () => {
    try {
      const res = await api.get(`/templates/${id}`);
      setTemplate(res.data);
      
      const configRes = await api.get(`/templates/${id}/placeholders`);
      if (configRes.data) {
        setFields(configRes.data);
        const initialForm = {};
        configRes.data.forEach(field => {
          initialForm[field.field_name] = "";
        });
        setFormData(initialForm);
      }
    } catch (err) {
      setError("Failed to load template data.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGenerate = async (format) => {
    setGenerating(true);
    setError("");
    try {
      const payload = {
        data: formData,
        format: format
      };
      
      const response = await api.post(`/templates/${id}/generate`, payload, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${(formData[fields[0]?.field_name] || "generated").replace(" ", "_")}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      setError("Failed to generate certificate.");
    } finally {
      setGenerating(false);
    }
  };

  const shareWhatsApp = async () => {
    try {
      setGenerating(true);
      const payload = { data: formData, format: "png" };
      const response = await api.post(`/templates/${id}/generate`, payload, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'image/png' });
      const file = new File([blob], 'certificate.png', { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Certificate',
          text: 'Here is your certificate!'
        });
      } else {
        alert("Native Web Share with images is not supported on this device/browser. Please download the PNG and share it manually.");
      }
    } catch (err) {
      console.error(err);
      if (err.name !== 'AbortError') {
        alert("Failed to share.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleImageLoaded = useCallback((w, h) => {
    setImageSize((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
  }, []);

  if (loading) return <Container sx={{ mt: 4 }}><CircularProgress /></Container>;
  
  const filename = template?.image_path ? template.image_path.split("\\\\").pop().split("/").pop() : "";
  const imageUrl = template?.image_path?.startsWith("http") ? template.image_path : `http://localhost:8000/uploads/templates/${filename}`;

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Generate Certificate: {template?.template_name}
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={4}>
        {/* LEFT SIDEBAR FORM */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>Fill Details</Typography>
            <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 3 }}>
              {fields.map(field => (
                <TextField
                  key={field.field_name}
                  label={field.field_name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  name={field.field_name}
                  value={formData[field.field_name] || ""}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              ))}
              
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => handleGenerate("png")}
                  disabled={generating || fields.length === 0}
                  fullWidth
                >
                  Download PNG
                </Button>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  onClick={() => handleGenerate("pdf")}
                  disabled={generating || fields.length === 0}
                  fullWidth
                >
                  Download PDF
                </Button>
                <Button 
                  variant="outlined" 
                  color="success" 
                  onClick={shareWhatsApp}
                  disabled={generating || fields.length === 0}
                  fullWidth
                >
                  Share via WhatsApp
                </Button>
              </Box>
            </Box>
          </Paper>
          
          <Box sx={{ mt: 4 }}>
            <Button variant="text" onClick={() => navigate("/")}>
              Back to Gallery
            </Button>
          </Box>
        </Grid>

        {/* RIGHT LIVE PREVIEW */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", bgcolor: "rgba(0,0,0,0.1)" }}>
            <Typography variant="h6" gutterBottom>Live Preview</Typography>
            <Box sx={{ border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", mt: 2, borderRadius: 2 }}>
              <Stage width={imageSize.width * scale} height={imageSize.height * scale} scaleX={scale} scaleY={scale}>
                <Layer>
                  <TemplateImage 
                    imageUrl={imageUrl} 
                    onImageLoaded={handleImageLoaded} 
                  />
                  {fields.map(field => (
                    <Text
                      key={field.field_name}
                      ref={(node) => { textRefs.current[field.field_name] = node; }}
                      text={formData[field.field_name] || `[${field.field_name}]`}
                      x={field.x_coordinate}
                      y={field.y_coordinate}
                      fontSize={field.font_size}
                      fontFamily={field.font_family || "Open Sans"}
                      fill={field.font_color || "black"}
                      opacity={formData[field.field_name] ? 1 : 0.5}
                    />
                  ))}
                </Layer>
              </Stage>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Generate;
