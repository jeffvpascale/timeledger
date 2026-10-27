using System.ComponentModel.DataAnnotations;
using TimeLedger.Api.Data.Entities;

namespace TimeLedger.Api.Data.Dtos
{
	public class TimeEntryResponseDto
	{
		public int Id { get; set; }

		public DateOnly Date { get; set; }

		[Required]
		public string Description { get; set; } = string.Empty;

		[Range(0.01, double.MaxValue)]
		public decimal TimeSpent { get; set; }

		public BillingStatus BillingStatus { get; set; }
	}
}
