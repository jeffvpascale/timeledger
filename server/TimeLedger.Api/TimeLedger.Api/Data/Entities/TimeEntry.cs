using System.ComponentModel.DataAnnotations;

namespace TimeLedger.Api.Data.Entities
{
	public class TimeEntry
	{
		public int Id { get; set; }

		public DateOnly Date { get; set; }

		[Required]
		[MaxLength(500)]
		public required string Description { get; set; } = string.Empty;

		[Range(0.01, double.MaxValue)]
		public decimal TimeSpent { get; set; }

		public BillingStatus BillingStatus { get; set; } = BillingStatus.Unbilled;

		public int ProjectId { get; set; }

		public Project Project { get; set; } = null!;
	}

	public enum BillingStatus
	{
		Unbilled,
		Billed,
		NonBillable
	}
}

