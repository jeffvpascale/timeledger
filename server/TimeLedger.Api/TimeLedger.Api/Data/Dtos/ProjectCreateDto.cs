using System.ComponentModel.DataAnnotations;

namespace TimeLedger.Api.Data.Dtos
{
	public class ProjectCreateDto
	{
		[Required]
		[MaxLength(100)]
		public required string Name { get; set; } = string.Empty;

		[MaxLength(500)]
		public string? Description { get; set; }

		[Range(0.00, double.MaxValue)]
		public decimal Rate { get; set; }

		public int ClientId { get; set; }

	}
}
