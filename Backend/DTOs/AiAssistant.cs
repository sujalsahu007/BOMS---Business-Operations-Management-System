namespace Backend.DTOs;

public class AiRequestDto
{
    public string Query { get; set; } = string.Empty;
    public string Context { get; set; } = string.Empty;
}

public class AiResponseDto
{
    public string Text { get; set; } = string.Empty;
    public List<AiVisualDto> Visuals { get; set; } = new();
    public AiActionDto? Action { get; set; }
}

public class AiVisualDto
{
    public string Type { get; set; } = string.Empty; // "kpi", "list"
    public string Title { get; set; } = string.Empty;
    public List<string> Items { get; set; } = new();
}

public class AiActionDto
{
    public string Label { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}
