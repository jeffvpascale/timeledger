using System.ComponentModel.DataAnnotations;
using TimeLedger.Api.Data.Entities;

namespace TimeLedger.Api.Data.Dtos
{
	public class TimeEntryCreateDto
	{
		[Required]
		public DateOnly? Date { get; set; }

		[Required]
		[MaxLength(500)]
		public required string Description { get; set; } = string.Empty;

		[Range(0.01, double.MaxValue)]
		public decimal TimeSpent { get; set; }

		public BillingStatus BillingStatus { get; set; }

		public int ProjectId { get; set; }
	}
}
