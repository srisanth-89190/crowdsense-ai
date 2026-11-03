from vision_layer import analyze_video

# Test with mock (no AMD needed)
result = analyze_video("any_path.mp4")  # mock ignores path
print("Vision result:")
print(result)