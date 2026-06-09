import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Typography, Box, Paper, Button, CircularProgress, Alert, IconButton } from "@mui/material";
import { ZoomIn, ZoomOut } from "@mui/icons-material";
import { Stage, Layer, Image as KonvaImage, Text, Transformer } from "react-konva";
import useImage from "use-image";
import api from "../services/api";

const TemplateImage = ({ imageUrl, onImageLoaded }) => {
  const [image] = useImage(imageUrl);
  
  useEffect(() => {
    if (image) {
      onImageLoaded(image.width, image.height);
    }
  }, [image]); // Removed onImageLoaded from dependencies to avoid infinite loop

  return image ? <KonvaImage image={image} /> : null;
};

const Configure = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [fontColor, setFontColor] = useState("#000000");
  
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const baseScale = Math.min(800 / imageSize.width, 600 / imageSize.height);
  const [zoomLevel, setZoomLevel] = useState(1);
  const scale = baseScale * zoomLevel;
  
  // Placeholder positions state
  const [placeholders, setPlaceholders] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  
  const trRef = React.useRef();
  const textRefs = React.useRef({});

  useEffect(() => {
    if (selectedId && trRef.current && textRefs.current[selectedId]) {
      trRef.current.nodes([textRefs.current[selectedId]]);
      trRef.current.getLayer().batchDraw();
    }
    
    // Auto-center all text nodes around their X coordinate
    Object.keys(textRefs.current).forEach(key => {
      const node = textRefs.current[key];
      if (node) {
        node.offsetX(node.width() / 2);
      }
    });
  }, [selectedId, placeholders]);

  useEffect(() => {
    fetchTemplateAndPlaceholders();
  }, [id]);

  const fetchTemplateAndPlaceholders = async () => {
    try {
      const res = await api.get(`/templates/${id}`);
      setTemplate(res.data);
      
      const configRes = await api.get(`/templates/${id}/placeholders`);
      if (configRes.data && configRes.data.length > 0) {
        // Load existing
        const loadedPlaceholders = {};
        configRes.data.forEach(c => {
          loadedPlaceholders[c.field_name] = {
            x: c.x_coordinate,
            y: c.y_coordinate,
            text: `[${c.field_name}]`,
            fontSize: c.font_size
          };
          // Assuming font_color is consistent across fields
          if (c.font_color) setFontColor(c.font_color);
        });
        setPlaceholders(loadedPlaceholders);
      } else {
        // Automatically detect if no existing placeholders
        autoDetectPlaceholders();
      }
    } catch (err) {
      setError("Failed to load template configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (e, key) => {
    setPlaceholders({
      ...placeholders,
      [key]: {
        ...placeholders[key],
        x: e.target.x(),
        y: e.target.y()
      }
    });
  };

  const handleTransformEnd = (e, key) => {
    const node = textRefs.current[key];
    const scaleY = node.scaleY();
    
    // Reset scale to 1 and apply to fontSize
    node.scaleX(1);
    node.scaleY(1);
    
    setPlaceholders({
      ...placeholders,
      [key]: {
        ...placeholders[key],
        x: node.x(),
        y: node.y(),
        fontSize: Math.max(5, Math.round(placeholders[key].fontSize * scaleY))
      }
    });
  };

  const autoDetectPlaceholders = async () => {
    setAnalyzing(true);
    setError("");
    try {
      const res = await api.post(`/templates/${id}/analyze`);
      const newCoords = res.data;
      if (newCoords.font_color) {
        setFontColor(newCoords.font_color);
      }
      if (newCoords.fields && Array.isArray(newCoords.fields)) {
        const detectedPlaceholders = {};
        newCoords.fields.forEach(field => {
          detectedPlaceholders[field.name] = {
            x: field.x,
            y: field.y,
            text: `[${field.name}]`,
            fontSize: 30 // default dynamic size
          };
        });
        setPlaceholders(detectedPlaceholders);
      }
    } catch (err) {
      setError("AI analysis failed. Please manually adjust placeholders.");
    } finally {
      setAnalyzing(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      const payload = Object.entries(placeholders).map(([key, config]) => ({
        field_name: key,
        x_coordinate: config.x,
        y_coordinate: config.y,
        font_size: config.fontSize,
        font_family: "Open Sans",
        font_color: fontColor
      }));
      await api.post(`/templates/${id}/placeholders`, payload);
      alert("Configuration saved successfully!");
      navigate("/");
    } catch (err) {
      setError("Failed to save configuration.");
    }
  };

  const handleImageLoaded = useCallback((w, h) => {
    setImageSize((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
  }, []);

  if (loading) return <Container sx={{ mt: 4 }}><CircularProgress /></Container>;
  if (error) return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  const filename = template?.image_path ? template.image_path.split("\\\\").pop().split("/").pop() : "";
  const imageUrl = template?.image_path?.startsWith("http") ? template.image_path : `http://localhost:8000/uploads/templates/${filename}`;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Configure Placeholders: {template?.template_name}
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Drag the text placeholders to the correct positions. Click a text field to resize its font using the mouse.
        </Typography>

        <Box sx={{ position: 'relative', mt: 1, display: "flex", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)", overflow: "auto", bgcolor: "rgba(0,0,0,0.1)", borderRadius: 2, maxHeight: "60vh" }}>
          
          {/* Floating Zoom Controls */}
          <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', p: 0.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
            <IconButton size="small" onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.1))} sx={{ color: 'white' }}>
              <ZoomIn />
            </IconButton>
            <IconButton size="small" onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))} sx={{ color: 'white' }}>
              <ZoomOut />
            </IconButton>
          </Box>

          <Stage 
            width={imageSize.width * scale} 
            height={imageSize.height * scale} 
            scaleX={scale} 
            scaleY={scale}
            onMouseDown={(e) => {
              // Deselect when clicking on empty area or image
              const clickedOnEmpty = e.target === e.target.getStage() || e.target.className === 'Image';
              if (clickedOnEmpty) {
                setSelectedId(null);
              }
            }}
            onTouchStart={(e) => {
              const clickedOnEmpty = e.target === e.target.getStage() || e.target.className === 'Image';
              if (clickedOnEmpty) {
                setSelectedId(null);
              }
            }}
          >
            <Layer>
              <TemplateImage 
                imageUrl={imageUrl} 
                onImageLoaded={handleImageLoaded} 
              />
              {Object.entries(placeholders).map(([key, config]) => (
                <Text
                  key={key}
                  ref={(node) => { textRefs.current[key] = node; }}
                  text={config.text}
                  x={config.x}
                  y={config.y}
                  fontSize={config.fontSize}
                  fontFamily="Open Sans"
                  fill={fontColor}
                  draggable
                  onClick={() => setSelectedId(key)}
                  onTap={() => setSelectedId(key)}
                  onDragEnd={(e) => handleDragEnd(e, key)}
                  onTransformEnd={(e) => handleTransformEnd(e, key)}
                />
              ))}
              {selectedId && (
                <Transformer
                  ref={trRef}
                  enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 10 || newBox.height < 10) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              )}
            </Layer>
          </Stage>
        </Box>

        <Box sx={{ mt: 4, display: "flex", gap: 2, alignItems: "center" }}>
          <Button variant="outlined" color="primary" onClick={autoDetectPlaceholders} disabled={analyzing}>
            {analyzing ? <CircularProgress size={24} /> : "Auto-Detect with AI"}
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
            <Typography variant="body2">Text Color:</Typography>
            <input 
              type="color" 
              value={fontColor} 
              onChange={(e) => setFontColor(e.target.value)} 
              style={{ cursor: "pointer", height: "36px" }}
            />
          </Box>
          <Button variant="outlined" color="success" onClick={() => {
            const name = window.prompt("Enter new field name (e.g., signature):");
            if (name) {
              setPlaceholders({...placeholders, [name.replace(/\s+/g, '_').toLowerCase()]: { x: 100, y: 100, text: `[${name}]`, fontSize: 30 }});
            }
          }} sx={{ ml: 2 }}>
            + Add Field
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" color="secondary" onClick={() => navigate("/")}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={saveConfiguration}>
            Save Configuration
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Configure;
