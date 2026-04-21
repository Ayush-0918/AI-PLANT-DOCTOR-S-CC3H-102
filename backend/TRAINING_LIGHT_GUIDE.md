# Plant Doctor Data + Training Guide (Lightweight, 100/Class)

This flow prepares generated CSV datasets, builds lightweight image data, supports field zip ingestion, trains the model, and runs validation.

## 1. Generate all knowledge/recommendation CSVs

```bash
backend/.venv/bin/python backend/scripts/generate_knowledge_assets.py
```

Generated files:
- `backend/data/generated/treatment_knowledge.csv` (500 rows)
- `backend/data/generated/translations_core.csv` (1000 rows, 5 languages)
- `backend/data/generated/plant_growth_care_recommendations.csv`
- `backend/data/generated/crop_recommendation.csv`
- `backend/data/generated/fertilizer_recommendation.csv`

Legacy sync:
- `backend/crop_recommendation.csv`
- `backend/fertilizer_recommendation.csv`

## 2. Build lightweight PlantVillage dataset (100 images/class)

```bash
backend/.venv/bin/python backend/scripts/clean_dataset.py --max-images-per-class 100 --seed 42
```

Output:
- `PlantVillage-Dataset/lightweight/color`
- `PlantVillage-Dataset/lightweight/manifest.json`

## 3. (Optional) Prepare field dataset (`plantdoc` folder or `field_images.zip`)

If your field data is in a folder named `plantdoc` at project root:

```bash
backend/.venv/bin/python backend/scripts/prepare_field_dataset.py \
  --source-path plantdoc \
  --max-images-per-class 100 \
  --val-ratio 0.2 \
  --seed 42
```

For your current external dataset location:

```bash
backend/.venv/bin/python backend/scripts/prepare_field_dataset.py \
  --source-path "/Users/aayu/Downloads/PlantDoc-Dataset" \
  --max-images-per-class 100 \
  --seed 42
```

If you have a zip:

```bash
backend/.venv/bin/python backend/scripts/prepare_field_dataset.py \
  --source-path field_images.zip \
  --max-images-per-class 100 \
  --val-ratio 0.2 \
  --seed 42
```

Output:
- `PlantVillage-Dataset/field/train`
- `PlantVillage-Dataset/field/validation`
- `PlantVillage-Dataset/field/field_manifest.json`

## 4. Build merged training bundle (in-domain + field)

```bash
backend/.venv/bin/python backend/scripts/build_training_bundle.py \
  --max-images-per-class 100 \
  --field-share 0.3 \
  --seed 42
```

Output:
- `PlantVillage-Dataset/training_bundle/color`
- `PlantVillage-Dataset/training_bundle/manifest.json`

## 5. Train model and save metrics

```bash
backend/.venv/bin/python backend/scripts/train_lite.py \
  --preset light \
  --dataset-dir PlantVillage-Dataset/training_bundle/color \
  --seed 42
```

Saved:
- `backend/app/plantvillage_model.pth`
- `backend/static/accuracy.json`
- `backend/static/training_report.json`
- `backend/static/model_registry.json`

## 6. Field validation (real-world)

```bash
backend/.venv/bin/python backend/scripts/evaluate_field.py \
  --dataset-dir PlantVillage-Dataset/field/validation \
  --batch-size 32
```

Saved:
- `backend/static/field_validation_report.json`
- active model field-eval metadata updated in `backend/static/model_registry.json`

## OpenWeather Integration

Set API key in `backend/.env`:

```env
OPENWEATHER_API_KEY=your_key_here
```

`/api/v1/ai/scan` and `/api/v1/geo/weather` will then return live weather + disease-risk context.

## 7. Quick Readiness Check

Run one command to verify generated CSV counts, model file, and field report presence:

```bash
backend/.venv/bin/python backend/scripts/check_data_readiness.py
```

Admin API endpoint:

```text
GET /api/v1/admin/ai/data-readiness
```
