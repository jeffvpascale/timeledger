using System.ComponentModel.DataAnnotations;

namespace TimeLedger.Api.Data.Dtos
{
	public class ProjectUpdateDto
	{
		[Required]
		public required string Name { get; set; } = string.Empty;

		public string? Description { get; set; }

		[Range(0.00, double.MaxValue)]
		public decimal Rate { get; set; }

		public bool IsArchived { get; set; }
	}
}
