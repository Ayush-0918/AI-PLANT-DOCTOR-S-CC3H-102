import torch  # type: ignore[import]
import torch.onnx  # type: ignore[import]
from torchvision.models import mobilenet_v3_large, MobileNet_V3_Large_Weights  # type: ignore[import]
import os

def export_model():
    print("🚀 Starting MobileNetV3-Large ONNX Export...")
    
    # 1. Initialize Model
    weights = MobileNet_V3_Large_Weights.DEFAULT
    model = mobilenet_v3_large(weights=weights)
    model.eval()
    
    # 2. Create Dummy Input (1 batch, 3 channels, 224x224 px)
    dummy_input = torch.randn(1, 3, 224, 224)
    
    # 3. Export Path
    output_dir = os.path.join(os.getcwd(), "web/public/models")
    os.makedirs(output_dir, exist_ok=True)
    onnx_path = os.path.join(output_dir, "plant_doctor_model.onnx")
    
    # 4. Export
    torch.onnx.export(
        model, 
        dummy_input, 
        onnx_path,
        export_params=True, 
        opset_version=12, 
        do_constant_folding=True,
        input_names=['input'], 
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    
    print(f"✅ Model successfully exported to: {onnx_path}")

if __name__ == "__main__":
    export_model()
