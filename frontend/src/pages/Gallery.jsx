import React, { useEffect, useState } from "react";
import { Container, Typography, Grid, Card, CardMedia, CardContent, CircularProgress, CardActionArea, IconButton, Menu, MenuItem, Box } from "@mui/material";
import { MoreVert as MoreVertIcon, Edit as EditIcon, Settings as SettingsIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Gallery = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState({});

  const handleMenuClick = (event, id) => {
    event.stopPropagation();
    setAnchorEl({ ...anchorEl, [id]: event.currentTarget });
  };

  const handleMenuClose = (event, id) => {
    if (event) event.stopPropagation();
    setAnchorEl({ ...anchorEl, [id]: null });
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get("/templates/");
      setTemplates(res.data);
    } catch (err) {
      console.error("Failed to fetch templates", err);
      // Auto redirect to login if unauthorized
      if (err.response?.status === 401) {
          navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (event, id) => {
    handleMenuClose(event, id);
    if (window.confirm("Are you sure you want to delete this template?")) {
      try {
        await api.delete(`/templates/${id}`);
        fetchTemplates();
      } catch (err) {
        console.error("Failed to delete", err);
      }
    }
  };

  const handleRename = async (event, id, currentName) => {
    handleMenuClose(event, id);
    const newName = window.prompt("Enter new template name:", currentName);
    if (newName && newName.trim() !== "" && newName !== currentName) {
      try {
        await api.put(`/templates/${id}/rename`, { template_name: newName });
        fetchTemplates();
      } catch (err) {
        console.error("Failed to rename", err);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
        Template Gallery
      </Typography>


      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={4}>
          {templates.map((template) => {
            // Need to convert backend absolute path or local path to a URL
            // Assuming backend serves /uploads route
            const filename = template.image_path.split("\\\\").pop().split("/").pop();
            const imageUrl = template.image_path.startsWith("http") ? template.image_path : `http://localhost:8000/uploads/templates/${filename}`;
            
            return (
              <Grid key={template.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card className="glass-interactive" sx={{ position: 'relative', height: 300, display: 'flex', flexDirection: 'column' }}>
                  <CardActionArea onClick={() => navigate(`/generate/${template.id}`)}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={imageUrl}
                      alt={template.template_name}
                      sx={{ objectFit: "cover", bgcolor: "rgba(0,0,0,0.2)" }}
                    />
                    <CardContent sx={{ flexGrow: 1, overflow: 'hidden' }}>
                      <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 600, pr: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {template.template_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Uploaded on {new Date(template.created_at).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                  
                  {/* 3 Dots Menu */}
                  <IconButton
                    onClick={(e) => handleMenuClick(e, template.id)}
                    sx={{ position: 'absolute', top: 180, right: 8, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                  >
                    <MoreVertIcon sx={{ color: 'white' }} />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl[template.id]}
                    open={Boolean(anchorEl[template.id])}
                    onClose={(e) => handleMenuClose(e, template.id)}
                    onClick={(e) => e.stopPropagation()}
                    slotProps={{ paper: { sx: { bgcolor: 'rgba(20,20,30,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' } } }}
                  >
                    <MenuItem onClick={(e) => { handleMenuClose(e, template.id); navigate(`/configure/${template.id}`); }}>
                      <SettingsIcon fontSize="small" sx={{ mr: 1 }} /> Configure Template
                    </MenuItem>
                    <MenuItem onClick={(e) => handleRename(e, template.id, template.template_name)}>
                      <EditIcon fontSize="small" sx={{ mr: 1 }} /> Rename
                    </MenuItem>
                    <MenuItem onClick={(e) => handleDelete(e, template.id)} sx={{ color: '#ff5252' }}>
                      <DeleteIcon fontSize="small" sx={{ mr: 1, color: '#ff5252' }} /> Delete
                    </MenuItem>
                  </Menu>
                </Card>
              </Grid>
            );
          })}
          {templates.length === 0 && (
            <Typography variant="subtitle1" sx={{ mt: 4, ml: 2 }}>
              No templates found. Upload one to get started.
            </Typography>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default Gallery;
