import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Scale as ScaleIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Save as SaveIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

interface IngredientFormData {
  name: string;
  unit: string;
  cost_per_unit: string;
  vendor_id: string;
}

const UNITS = [
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'l', label: 'Liters (l)' },
  { value: 'cup', label: 'Cups' },
  { value: 'tbsp', label: 'Tablespoons (tbsp)' },
  { value: 'tsp', label: 'Teaspoons (tsp)' },
  { value: 'piece', label: 'Piece' },
  { value: 'each', label: 'Each' }
];

export const BasicForm: React.FC = () => {
  const [formData, setFormData] = useState<IngredientFormData>({
    name: '',
    unit: '',
    cost_per_unit: '',
    vendor_id: ''
  });

  const [errors, setErrors] = useState<Partial<IngredientFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (field: keyof IngredientFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<IngredientFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ingredient name is required';
    }

    if (!formData.unit) {
      newErrors.unit = 'Unit is required';
    }

    if (!formData.cost_per_unit.trim()) {
      newErrors.cost_per_unit = 'Cost per unit is required';
    } else {
      const cost = parseFloat(formData.cost_per_unit);
      if (isNaN(cost) || cost < 0) {
        newErrors.cost_per_unit = 'Please enter a valid positive number';
      }
    }

    if (!formData.vendor_id) {
      newErrors.vendor_id = 'Vendor is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('http://localhost:5001/ingredient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          unit: formData.unit,
          cost_per_unit: parseFloat(formData.cost_per_unit),
          vendor_id: parseInt(formData.vendor_id)
        }),
      });

      if (response.ok) {
        setSubmitMessage({ type: 'success', text: 'Ingredient added successfully!' });
        handleClear();
      } else {
        const errorData = await response.json();
        setSubmitMessage({ type: 'error', text: errorData.message || 'Failed to add ingredient' });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({
      name: '',
      unit: '',
      cost_per_unit: '',
      vendor_id: ''
    });
    setErrors({});
    setSubmitMessage(null);
  };

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 3 }}>
      <Paper elevation={3} sx={{ padding: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
          <RestaurantIcon sx={{ fontSize: 32, marginRight: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Add New Ingredient
          </Typography>
        </Box>

        <Divider sx={{ marginBottom: 3 }} />

        {submitMessage && (
          <Alert 
            severity={submitMessage.type} 
            sx={{ marginBottom: 3 }}
            onClose={() => setSubmitMessage(null)}
          >
            {submitMessage.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* First Row */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {/* Ingredient Name */}
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Ingredient Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={!!errors.name}
                  helperText={errors.name}
                  placeholder="e.g., Organic Tomatoes"
                  InputProps={{
                    startAdornment: <RestaurantIcon sx={{ marginRight: 1, color: 'action.active' }} />
                  }}
                />
              </Box>

              {/* Unit */}
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <FormControl fullWidth error={!!errors.unit}>
                  <InputLabel>Unit of Measurement</InputLabel>
                  <Select
                    value={formData.unit}
                    onChange={handleInputChange('unit')}
                    label="Unit of Measurement"
                    startAdornment={<ScaleIcon sx={{ marginRight: 1, color: 'action.active' }} />}
                  >
                    {UNITS.map((unit) => (
                      <MenuItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.unit && (
                    <Typography variant="caption" color="error" sx={{ marginTop: 0.5, marginLeft: 1.75 }}>
                      {errors.unit}
                    </Typography>
                  )}
                </FormControl>
              </Box>
            </Box>

            {/* Second Row */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {/* Cost Per Unit */}
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Cost Per Unit"
                  type="number"
                  value={formData.cost_per_unit}
                  onChange={handleInputChange('cost_per_unit')}
                  error={!!errors.cost_per_unit}
                  helperText={errors.cost_per_unit}
                  placeholder="0.00"
                  inputProps={{ step: "0.01", min: "0" }}
                  InputProps={{
                    startAdornment: <MoneyIcon sx={{ marginRight: 1, color: 'action.active' }} />
                  }}
                />
              </Box>

              {/* Vendor */}
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <FormControl fullWidth error={!!errors.vendor_id}>
                  <InputLabel>Vendor</InputLabel>
                  <Select
                    value={formData.vendor_id}
                    onChange={handleInputChange('vendor_id')}
                    label="Vendor"
                    startAdornment={<BusinessIcon sx={{ marginRight: 1, color: 'action.active' }} />}
                  >
                    <MenuItem value="1">Local Farm Co.</MenuItem>
                    <MenuItem value="2">Wholesale Foods Inc.</MenuItem>
                    <MenuItem value="3">Premium Ingredients Ltd.</MenuItem>
                    <MenuItem value="4">Organic Suppliers</MenuItem>
                  </Select>
                  {errors.vendor_id && (
                    <Typography variant="caption" color="error" sx={{ marginTop: 0.5, marginLeft: 1.75 }}>
                      {errors.vendor_id}
                    </Typography>
                  )}
                </FormControl>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', marginTop: 2 }}>
              <Button
                variant="outlined"
                onClick={handleClear}
                startIcon={<ClearIcon />}
                disabled={isSubmitting}
              >
                Clear
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Ingredient'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};
